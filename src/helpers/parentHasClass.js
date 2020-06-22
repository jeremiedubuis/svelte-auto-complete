const _parentHasClass = (element, classname) => {
    if (element.className && element.className.split && element.className.split(' ').indexOf(classname)>=0) return true;
    return element.parentNode && parentHasClass(element.parentNode, classname);
};

const parentHasClass = (element, ...classNames) => {
    for (let i = 0, iLength = classNames.length; i<iLength; i++) {
        if (_parentHasClass(element, classNames[i])) return true;
    }
    return false;
};

export default parentHasClass;
