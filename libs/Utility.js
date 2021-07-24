const inherits = require("util").inherits;
const moduleexports = module.exports = {};

moduleexports.addInheritance = (subclass, superclass) => {
    const proto = subclass.prototype;
    inherits(subclass, superclass);
    subclass.prototype.parent = superclass.prototype;
    for (const a in proto) {
        subclass.prototype[a] = proto[a];
    }
};

moduleexports.addSupportTo = (subclass, superclass) => {
    moduleexports.addInheritance(subclass,superclass);
};