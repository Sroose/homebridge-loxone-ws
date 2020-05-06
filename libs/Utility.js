const inherits = require("util").inherits;
const exports = module.exports = {};

exports.addInheritance = (subclass, superclass) => {
    const proto = subclass.prototype;
    inherits(subclass, superclass);
    subclass.prototype.parent = superclass.prototype;
    for (const a in proto) {
        subclass.prototype[a] = proto[a];
    }
};

exports.addSupportTo = (subclass, superclass) => {
    exports.addInheritance(subclass,superclass);
};