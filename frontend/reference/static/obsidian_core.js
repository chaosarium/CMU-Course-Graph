// global cache
var cacheAvailable = null;

// local storage stuff
function ls_test_available() {
    if (cacheAvailable != null) {
        return cacheAvailable
    }
    try {
        window.localStorage.setItem('testVal', 'testVal');
        window.localStorage.removeItem('testVal');
        cacheAvailable = true;
        return true;
    } catch (e) {
        cacheAvailable = false;
        return false;
    }
}

function ls_get(key) {
    if (ls_test_available() == false) {
        return false
    }
    return window.localStorage.getItem(key);
}
function ls_set(key, value) {
    if (ls_test_available() == false) {
        return false
    }
    return window.localStorage.setItem(key, value);
}

function lazy_load_script(path, callback, callback_args) {
    console.log('loading', path);
    // create script tag
    var elScript = document.createElement('script');
    elScript.setAttribute('type', 'text/javascript');
    elScript.setAttribute('charset', 'utf-8');

    // set path to load, and callback to be run when loaded
    elScript.setAttribute('src', path);
    elScript.addEventListener('load', (event) => {
        callback(...callback_args);
    });

    // add script tag to the end of body
    document.getElementsByTagName("body")[0].appendChild(elScript);
}

function rem(rem) {
    return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}
function vh() {
    return Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
}
