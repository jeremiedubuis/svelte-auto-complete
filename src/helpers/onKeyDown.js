const onKeyDown = (key, callback) => {
    const func = (e) => {
        if (e.key === key) callback(e);
    }
    window.addEventListener('keydown', func);

    return () => window.removeEventListener('keydown', func)
}

export default onKeyDown;
