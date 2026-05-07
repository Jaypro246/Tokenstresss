import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const APP_SOURCE_GLOBS = ['src/**/*.{js,jsx,ts,tsx,mjs,mts,cjs,cts}'];
const SERVER_ONLY_NEXT_MODULES = new Set(['next/headers', 'next/server']);

function hasLeadingDirective(program, directive) {
for (const statement of program.body) {
if (statement.type === 'ExpressionStatement' && typeof statement.directive === 'string') {
if (statement.directive === directive) {
return true;
}

continue;
}

break;
}

return false;
}

function hasAsyncTrueOption(node) {
if (!node || node.type !== 'ObjectExpression') {
return false;
}

return node.properties.some((property) => {
if (property.type !== 'Property' || property.kind !== 'init' || property.computed) {
return false;
}

const keyName =
property.key.type === 'Identifier'
? property.key.name
: property.key.type === 'Literal' && typeof property.key.value === 'string'
? property.key.value
: null;

return keyName === 'async' && property.value.type === 'Literal' && property.value.value === true;
});
}

function isGetCloudflareContextMember(callee, namespaceImports) {
if (
callee.type !== 'MemberExpression' ||
callee.object.type !== 'Identifier' ||
!namespaceImports.has(callee.object.name)
) {
return false;
}

if (!callee.computed && callee.property.type === 'Identifier') {
return callee.property.name === 'getCloudflareContext';
}

return callee.computed && callee.property.type === 'Literal' && callee.property.value === 'getCloudflareContext';
}

const templateGuardrails = {
rules: {
'no-async-get-cloudflare-context-option': {
meta: {
type: 'problem',
schema: [],
messages: {
preferAwait:
'Prefer `await getCloudflareContext()` over `getCloudflareContext({ async: true })` in generated template app code.',
},
},
create(context) {
const namedImports = new Set();
const namespaceImports = new Set();

return {
ImportDeclaration(node) {
if (node.source.value !== '@opennextjs/cloudflare') {
return;
}

for (const specifier of node.specifiers) {
if (
specifier.type === 'ImportSpecifier' &&
specifier.imported.type === 'Identifier' &&
specifier.imported.name === 'getCloudflareContext'
) {
namedImports.add(specifier.local.name);
}

if (specifier.type === 'ImportNamespaceSpecifier') {
namespaceImports.add(specifier.local.name);
}
}
},
CallExpression(node) {
if (!hasAsyncTrueOption(node.arguments[0])) {
return;
}

if (node.callee.type === 'Identifier' && namedImports.has(node.callee.name)) {
context.report({ node, messageId: 'preferAwait' });
}

if (isGetCloudflareContextMember(node.callee, namespaceImports)) {
context.report({ node, messageId: 'preferAwait' });
}
},
};
},
},
'no-server-next-imports-in-use-client': {
meta: {
type: 'problem',
schema: [],
messages: {
serverOnly:
'`{{moduleName}}` cannot be imported in a `use client` file. Move this code to a server module or pass the data in through props.',
},
},
create(context) {
let isUseClientFile = false;

function maybeReport(node, sourceValue) {
if (!isUseClientFile || !SERVER_ONLY_NEXT_MODULES.has(sourceValue)) {
return;
}

context.report({
node,
messageId: 'serverOnly',
data: { moduleName: sourceValue },
});
}

return {
Program(node) {
isUseClientFile = hasLeadingDirective(node, 'use client');
},
ImportDeclaration(node) {
if (typeof node.source.value === 'string') {
maybeReport(node.source, node.source.value);
}
},
ExportAllDeclaration(node) {
if (node.source && typeof node.source.value === 'string') {
maybeReport(node.source, node.source.value);
}
},
ExportNamedDeclaration(node) {
if (node.source && typeof node.source.value === 'string') {
maybeReport(node.source, node.source.value);
}
},
ImportExpression(node) {
if (node.source.type === 'Literal' && typeof node.source.value === 'string') {
maybeReport(node.source, node.source.value);
}
},
};
},
},
},
};

const eslintConfig = [
{
ignores: [
'.next/**',
'.open-next/**',
'.turbo/**',
'.wrangler/**',
'build/**',
'coverage/**',
'dist/**',
'node_modules/**',
'out/**',
'css.d.ts',
'next-env.d.ts',
'worker-configuration.d.ts',
],
},
...nextCoreWebVitals,
...nextTypescript,
{
linterOptions: {
reportUnusedDisableDirectives: 'error',
},
},
{
files: APP_SOURCE_GLOBS,
plugins: {
template: templateGuardrails,
},
rules: {
'no-restricted-imports': [
'error',
{
paths: [
{
name: '@opennextjs/cloudflare',
importNames: ['getRequestContext'],
message:
'Do not use `getRequestContext()` in generated template app code. Prefer `await getCloudflareContext()` instead.',
},
{
name: 'crypto',
message:
'Use platform Web Crypto globals such as `crypto.randomUUID()` or `crypto.subtle` instead of importing Node crypto in template app source.',
},
{
name: 'node:crypto',
message:
'Use platform Web Crypto globals such as `crypto.randomUUID()` or `crypto.subtle` instead of importing `node:crypto` in template app source.',
},
{
name: 'uuid',
message:
'Use `crypto.randomUUID()` instead of the `uuid` package in template app source.',
},
],
},
],
'template/no-async-get-cloudflare-context-option': 'error',
'template/no-server-next-imports-in-use-client': 'error',
},
},
];

export default eslintConfig;
