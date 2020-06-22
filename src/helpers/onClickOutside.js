import parentHasClass from './parentHasClass';

const targetHasExcludedClass = (target, excludedClasses) => {
    if (!excludedClasses || !excludedClasses.length) return false;
    return parentHasClass(target, ...excludedClasses);
}


const onClickFactory = (parent, callback, excludedClasses) => e => {
    console.log(e.target)
    if (!parent || !parent.contains(e.target) && !targetHasExcludedClass(e.target, excludedClasses)) {
        if (typeof callback === 'function') {
            callback(e);
        }
    }
};

const onClickOutside = (parent, callback, excludedClasses) => {
    const func = onClickFactory(parent, callback, excludedClasses);
    window.addEventListener('click', func);

    return () => window.removeEventListener('click', func);
}

export default onClickOutside;
