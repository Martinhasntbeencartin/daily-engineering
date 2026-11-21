/* Stamps index.html's links to css/ and js/ with a fingerprint of their contents (?v=…), so browsers fetch the new
   files right after each deploy instead of reusing cached ones. Run it after changing any of them:
       node tools/stamp.js
   tests/exercises.test.js fails if the stamp is out of date. */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const root = path.join(__dirname, '..'), page = path.join(root, 'index.html');
const REF = /((?:href|src)="((?:css|js)\/[\w.-]+\.(?:css|js)))(?:\?v=\w+)?"/g;

function fingerprint(html) {
    const hash = crypto.createHash('sha1');
    for (const [, , file] of html.matchAll(REF)) hash.update(file).update(fs.readFileSync(path.join(root, file)));
    return hash.digest('hex').slice(0, 10);
}
function stamp(html) {
    const v = fingerprint(html);
    return html.replace(REF, `$1?v=${v}"`);
}
module.exports = {fingerprint, stamp, REF};

if (require.main === module) {
    const html = fs.readFileSync(page, 'utf8'), out = stamp(html);
    if (out !== html) fs.writeFileSync(page, out);
    console.log(`index.html assets stamped v=${fingerprint(html)}${out === html ? ' (already current)' : ''}`);
}
