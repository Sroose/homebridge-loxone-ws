import {inherits} from "util";
const exports = module.exports = {};

export function addInheritance(subclass, superclass) {
    const proto = subclass.prototype;
    inherits(subclass, superclass);
    subclass.prototype.parent = superclass.prototype;
    for (const a in proto) {
        subclass.prototype[a] = proto[a];
    }
}

export function addSupportTo(subclass, superclass) {
    exports.addInheritance(subclass,superclass);
}