import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const OUTPUT_DIR = path.join(__dirname, '../src/dto-llms');
const COMMON_IMPORTS_LIST = [
    'ApiProperty',
];
const CLASS_VALIDATOR_IMPORTS_LIST = [
    'IsString', 'IsNumber', 'IsBoolean', 'IsOptional', 'IsArray', 'ValidateNested'
];
const CLASS_TRANSFORMER_IMPORTS_LIST = [
    'Type'
];

function kebabCase(str) {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

async function readFileSafe(filePath) {
    try {
        return await fs.readFile(filePath, 'utf8');
    } catch (err) {
        return null;
    }
}

async function fetchMarkdown(url) {
    console.log(`Fetching ${url}...`);
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        return await response.text();
    } catch (err) {
        console.error(`Failed to fetch ${url}`, err);
        return null;
    }
}

function extractOpenApiBlock(md) {
    const codeBlockRegex = /```(?:yaml|yml|json)?\s*([\s\S]*?)```/g;
    let match;
    while ((match = codeBlockRegex.exec(md))) {
        const block = match[1];
        if (block.includes('components:') && block.includes('schemas:')) {
            return block;
        }
    }
    return null;
}

function getSchemaFromMarkdown(md, schemaName) {
    const text = extractOpenApiBlock(md);
    if (!text) return null;

    try {
        let spec;
        if (text.trim().startsWith('{')) {
            spec = JSON.parse(text);
        } else {
            spec = yaml.load(text);
        }

        const schemas = spec.components?.schemas;
        if (!schemas || !schemas[schemaName]) return null;

        return {
            schema: schemas[schemaName],
            allSchemas: schemas,
            spec
        };
    } catch (e) {
        console.error('Failed to parse schema block:', e.message);
        return null;
    }
}

// Data Handling

function collectDtoInfo(schema, className, allSchemas, ctx, isComm, collectedClasses, dependencies) {

    // 0. Handle Apidog specific refs
    let refTarget = schema.$ref;
    if (!refTarget && schema['x-apidog-refs']) {
        const refs = Object.values(schema['x-apidog-refs']);
        if (refs.length > 0 && refs[0].$ref) {
            refTarget = refs[0].$ref;
        }
    }

    // 1.5 Handle allOf / oneOf
    if (schema.allOf) {
        if (!schema.properties) schema.properties = {};
        if (!schema.required) schema.required = [];

        for (const part of schema.allOf) {
            let partSchema = part;
            if (part.$ref) {
                // If it's a ref, logic to finding extensions
                let partRef = part.$ref;
                if (!partRef && part['x-apidog-refs']) {
                    // Apidog handling inside allOf?
                }

                const refName = partRef ? partRef.split('/').pop() : null;
                if (refName) {
                    // Check Comm
                    if (ctx.commMap.has(refName)) {
                        const info = ctx.commMap.get(refName);
                        dependencies.add(refName);
                        if (!schema._extensions) schema._extensions = [];
                        schema._extensions.push(info.className); // We import directly, no namespace needed
                    }
                    // Check Local
                    else if (allSchemas && allSchemas[refName]) {
                        const nestedClassName = `${refName}Dto`;
                        if (!collectedClasses.has(nestedClassName)) {
                            collectDtoInfo(allSchemas[refName], nestedClassName, allSchemas, ctx, isComm, collectedClasses, dependencies);
                        }
                        if (!schema._extensions) schema._extensions = [];
                        schema._extensions.push(nestedClassName);

                        // If we extend a local class, we don't need to copy properties if TS supports `extends`.
                        // But for simplicity/robustness, let's also MERGE properties if possible?
                        // Actually `extends` is better.
                    }
                }
            }

            if (partSchema.properties) {
                Object.assign(schema.properties, partSchema.properties);
                if (partSchema.required) {
                    schema.required = [...new Set([...schema.required, ...partSchema.required])];
                }
            }
        }

        schema.type = 'object';
    }

    // 1. Handle Reference
    if (refTarget) {
        const refName = refTarget.split('/').pop();

        // Check if it matches a known Comm type
        if (ctx.commMap.has(refName)) {
            const commInfo = ctx.commMap.get(refName);

            if (isComm) {
                dependencies.add(refName);
                return commInfo.className;
            } else {
                dependencies.add(refName);
                return commInfo.className;
            }
        }

        // Local Reference (within same file/schema set)
        if (allSchemas && allSchemas[refName]) {
            const nestedClassName = `${refName}Dto`;
            if (!collectedClasses.has(nestedClassName)) {
                collectDtoInfo(allSchemas[refName], nestedClassName, allSchemas, ctx, isComm, collectedClasses, dependencies);
            }
            return nestedClassName;
        }

        return 'any';
    }

    // 2. Primitives
    if (schema.type === 'string') return 'string';
    if (schema.type === 'integer' || schema.type === 'number') return 'number';
    if (schema.type === 'boolean') return 'boolean';

    // 3. Array
    if (schema.type === 'array') {
        if (!schema.items) return 'any[]';
        // Pass "Item" suffix for nested anonymous objects in array
        const itemType = collectDtoInfo(schema.items, className + 'Item', allSchemas, ctx, isComm, collectedClasses, dependencies);
        return `${itemType}[]`;
    }

    // 4. Object
    if (schema.type === 'object' && schema.properties) {
        if (collectedClasses.has(className)) return className;

        const fields = [];
        const requiredSet = new Set(schema.required || []);

        for (const [propName, propSchema] of Object.entries(schema.properties)) {
            // Recurse
            let propClassName = className.replace(/Dto$/, '') + propName + 'Dto';

            const fieldType = collectDtoInfo(propSchema, propClassName, allSchemas, ctx, isComm, collectedClasses, dependencies);

            const isArray = fieldType.endsWith('[]');
            const baseType = isArray ? fieldType.slice(0, -2) : fieldType;
            const isPrimitive = ['string', 'number', 'boolean', 'any'].includes(baseType);
            const isRef = !isPrimitive;

            fields.push({
                name: propName,
                required: requiredSet.has(propName),
                isArray,
                tsType: fieldType,
                baseType,
                isPrimitive,
                isRef,
                description: propSchema.description
            });
        }

        collectedClasses.set(className, {
            className,
            fields,
            extensions: schema._extensions // Retrieve extensions here
        });
        return className;
    }

    return 'any';
}

function generateFileContent(metaList, dependencies, ctx, currentSchemaName) {
    let code = '';

    for (const meta of metaList) {
        let classDef = `export class ${meta.className}`;
        if (meta.extensions && meta.extensions.length > 0) {
            // Single inheritance only. Pick the first one.
            // If explicit Comm reference, it will be "Comm.XxxDto" but we are importing it directly now?
            // Wait, dependencies handling:
            // If isComm=true, dependency name is 'TravelAgencyTypeDto'.
            // If isComm=false, dependency name is 'TravelAgencyTypeDto' (because we import { TravelAgencyTypeDto } from ...).

            // `collectDtoInfo` returns JUST the ClassName now for both cases?
            // Let's check:
            // isComm: return commInfo.className -> "TravelAgencyTypeDto"
            // !isComm: return commInfo.className -> "TravelAgencyTypeDto"
            // So extensions array contains "TravelAgencyTypeDto".

            // However, imports are handled by caller.
            // So we can just extend.
            classDef += ` extends ${meta.extensions[0]}`;
        }
        classDef += ` {\n`;
        code += classDef;

        meta.fields.forEach(f => {
            const decorators = [];

            // ApiProperty
            const apiOpts = [];
            apiOpts.push(`required: ${f.required}`);
            if (f.isArray) apiOpts.push('isArray: true');
            if (f.description) {
                const safeDesc = f.description.replace(/'/g, "\\'").replace(/\n/g, ' ');
                apiOpts.push(`description: '${safeDesc}'`);
            }
            if (f.isRef) {
                apiOpts.push(`type: () => ${f.baseType}`);
            }

            decorators.push(`@ApiProperty({ ${apiOpts.join(', ')} })`);

            // Validation
            if (f.isRef) {
                decorators.push(`@ValidateNested(${f.isArray ? '{ each: true }' : ''})`);
                decorators.push(`@Type(() => ${f.baseType})`);
            } else {
                // Primitive types - add { each: true } for arrays
                if (f.baseType === 'string') {
                    decorators.push(f.isArray ? '@IsString({ each: true })' : '@IsString()');
                } else if (f.baseType === 'number') {
                    decorators.push(f.isArray ? '@IsNumber({}, { each: true })' : '@IsNumber()');
                } else if (f.baseType === 'boolean') {
                    decorators.push(f.isArray ? '@IsBoolean({ each: true })' : '@IsBoolean()');
                }
                // 'any' type - @IsOptional below will handle whitelist validation
            }

            if (f.isArray) decorators.push('@IsArray()');
            if (!f.required) decorators.push('@IsOptional()');

            decorators.forEach(d => { code += `  ${d}\n`; });
            code += `  ${f.name}${f.required ? '!' : '?'}: ${f.tsType};\n\n`;
        });
        code += `}\n\n`;
    }

    return code;
}


async function main() {
    const indexFile = path.join(__dirname, '../spec/schema-llms-index.json');
    const indexJson = await readFileSafe(indexFile);
    if (!indexJson) process.exit(1);
    const index = JSON.parse(indexJson);

    // Initialize Global Context
    const ctx = {
        commMap: new Map() // Name -> { className, fileName }
    };

    // Pre-fill Comm Map
    index.comm.forEach(item => {
        const className = `${item.name}Dto`;
        const fileName = `${kebabCase(item.name)}.dto`; // no .ts extension in import
        ctx.commMap.set(item.name, { className, fileName });
    });

    const commDir = path.join(OUTPUT_DIR, 'common');
    await fs.mkdir(commDir, { recursive: true });

    // 1. Generate Comm Modules
    for (const item of index.comm) {
        const md = await fetchMarkdown(item.url);
        if (!md) continue;

        const parsed = getSchemaFromMarkdown(md, item.name);
        if (!parsed) continue;

        const collectedMap = new Map();
        const dependencies = new Set();

        collectDtoInfo(parsed.schema, `${item.name}Dto`, parsed.allSchemas, ctx, true, collectedMap, dependencies);

        let fileContent = `import { ${COMMON_IMPORTS_LIST.join(', ')} } from '@nestjs/swagger';\n`;
        fileContent += `import { ${CLASS_TRANSFORMER_IMPORTS_LIST.join(', ')} } from 'class-transformer';\n`;
        fileContent += `import { ${CLASS_VALIDATOR_IMPORTS_LIST.join(', ')} } from 'class-validator';\n`;

        if (dependencies.size > 0) {
            fileContent += '\n';
            dependencies.forEach(refName => {
                if (refName === item.name) return; // Skip self
                if (ctx.commMap.has(refName)) {
                    const info = ctx.commMap.get(refName);
                    fileContent += `import { ${info.className} } from './${info.fileName}';\n`;
                }
            });
            fileContent += '\n';
        }

        fileContent += generateFileContent(collectedMap.values(), dependencies, ctx, item.name);

        const outPath = path.join(commDir, `${kebabCase(item.name)}.dto.ts`);
        await fs.writeFile(outPath, fileContent);
        console.log(`Generated common/${kebabCase(item.name)}.dto.ts`);
    }

    // 2. Generate API Modules
    const mapping = {};
    for (const item of index.rqrs) {
        let apiName, kind;
        if (item.name.endsWith('RQ')) { apiName = item.name.slice(0, -2); kind = 'RQ'; }
        else if (item.name.endsWith('RS')) { apiName = item.name.slice(0, -2); kind = 'RS'; }
        else continue;

        const md = await fetchMarkdown(item.url);
        if (!md) continue;

        const parsed = getSchemaFromMarkdown(md, item.name);
        if (!parsed) continue;

        const collectedMap = new Map();
        const dependencies = new Set();
        collectDtoInfo(parsed.schema, `${item.name}Dto`, parsed.allSchemas, ctx, false, collectedMap, dependencies);

        const apiKebab = kebabCase(apiName);
        const outputDir = path.join(OUTPUT_DIR, apiKebab);
        await fs.mkdir(outputDir, { recursive: true });

        let fileContent = `import { ${COMMON_IMPORTS_LIST.join(', ')} } from '@nestjs/swagger';\n`;
        fileContent += `import { ${CLASS_TRANSFORMER_IMPORTS_LIST.join(', ')} } from 'class-transformer';\n`;
        fileContent += `import { ${CLASS_VALIDATOR_IMPORTS_LIST.join(', ')} } from 'class-validator';\n`;

        if (dependencies.size > 0) {
            fileContent += '\n';
            dependencies.forEach(refName => {
                if (ctx.commMap.has(refName)) {
                    const info = ctx.commMap.get(refName);
                    fileContent += `import { ${info.className} } from '../common/${info.fileName}';\n`;
                }
            });
            fileContent += '\n';
        }

        fileContent += generateFileContent(collectedMap.values(), dependencies, ctx, item.name);
        await fs.writeFile(path.join(outputDir, `${apiKebab}-${kind.toLowerCase()}.dto.ts`), fileContent);
        console.log(`Generated ${apiKebab}/${apiKebab}-${kind.toLowerCase()}.dto.ts`);

        // Mapping Logic
        if (kind === 'RQ') {
            let targetRS = '';
            if (['OrderReshopRQ', 'OrderQuoteRQ'].includes(item.name)) targetRS = 'OrderReshopRS';
            else if (['OrderCreateRQ', 'OrderRetrieveRQ', 'OrderChangeRQ'].includes(item.name)) targetRS = 'OrderViewRS';
            else targetRS = `${apiName}RS`;

            if (!mapping[targetRS]) mapping[targetRS] = [];
            if (!mapping[targetRS].includes(item.name)) mapping[targetRS].push(item.name);
        }
    }

    await fs.writeFile(path.join(__dirname, '../spec/llms-api-mapping.json'), JSON.stringify(mapping, null, 2));
    console.log('Mapping saved.');
}

main();
