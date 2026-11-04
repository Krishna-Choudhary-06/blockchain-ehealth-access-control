const fs = require('fs');
const path = require('path');

const bgwDir = path.join(__dirname, 'frontend', 'src', 'bgw');
const files = fs.readdirSync(bgwDir).filter(f => f.endsWith('.js'));

files.forEach(file => {
    const filePath = path.join(bgwDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Remove 'use strict'
    content = content.replace(/'use strict';\n/g, '');

    // 2. Convert module.exports = ... to export default ...
    content = content.replace(/module\.exports\s*=\s*/g, 'export default ');

    // 3. Convert destructuring requires: const { foo } = require('bar'); 
    // -> import bar from 'bar'; const { foo } = bar;
    content = content.replace(/const\s+\{\s*([^}]+)\s*\}\s*=\s*require\((['"][^'"]+['"])\);/g, (match, vars, mod) => {
        const modName = mod.replace(/['"\.\/]/g, '') + 'Mod';
        return `import ${modName} from ${mod};\nconst { ${vars} } = ${modName};`;
    });

    // 4. Convert simple requires: const foo = require('bar'); 
    // -> import foo from 'bar';
    content = content.replace(/const\s+([a-zA-Z0-9_]+)\s*=\s*require\((['"][^'"]+['"])\);/g, "import $1 from $2;");

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Converted ${file} to ES Modules`);
});
