var emitter = require('emitter');
var editable = require('editable');

module.exports = makeEditable;
function makeEditable(elements, options) {
    options = options || {};
    options.prefix = options.prefix || false;
    options.suffix = options.suffix || false;
    options.format = options.format || function (v) { return v; }
    options.unfomrat = options.unformat || options.format.unformat || function (v) { return v; }
    options.validate = options.validate || options.format.validate || function (v) { return /^\d*\.\d*$/g.test(v); }
    options.maintainSize = options.maintainSize || false;
    editable.click(elements, function (element) {
        if (element.getAttribute('data-in-edit-mode') == 'true') return;
        element.setAttribute('data-in-edit-mode', 'true');
        edit(element, options);
    });
}
emitter(makeEditable);

function edit(element, options) {
    var dimensions;
    var oldStyle;
    if (options.maintainSize === true) {
        dimensions = editable.dimensions(element);
    }
    emit('pre-begin-edit', element);
    var value = element.textContent.trim().replace(/[^\d\.]/g, '');

    element.innerHTML = html(value, options);

    var edit = element.getElementsByTagName('input')[0];
    if (options.maintainSize === true) {
        var editDimensions = editable.transformDimensions(edit, dimensions);
        //todo: subtract prefix and suffix width
        edit.style.width = editDimensions.width + 'px';
        edit.style.height = editDimensions.height + 'px';
        oldStyle = {width: element.style.width, height: element.style.height};
        element.style.width = dimensions.width + 'px';
        element.style.height = dimensions.height + 'px';
    }
    edit.focus();
    editable.blur(edit, function () {
        if (element.getAttribute('data-in-edit-mode') != 'true') return;
        var newValue = options.unformat(edit.value.trim());
        if (!options.validate(newValue)) {
            setTimeout(function () {
                edit.focus();
            }, 10);
            return;
        }
        element.setAttribute('data-in-edit-mode', 'false');
        emit('pre-end-edit', element);
        element.innerHTML = options.format(newValue);
        if (options.maintainSize === true) {
            element.style.width = oldStyle.width;
            element.style.height = oldStyle.height;
        }
        if (value != newValue) {
            emit('update', element, newValue);
        }
        emit('post-end-edit', element);
    });
    emit('post-begin-edit', element);
}

function emit() {
    module.exports.emit.apply(module.exports, arguments);
    editable.emit.apply(editable, arguments);
}

function html(value, options) {
    var buf = [];
    if (options.prefix || options.suffix) {
        buf.push('<div class="');
        if (options.prefix) buf.push('input-prepend');
        if (options.prefix && options.suffix) buf.push(' ');
        if (options.suffix) buf.push('input-append');
        buf.push('">');
        if (options.prefix) buf.push('<span class="add-on">', options.prefix, '</span>');
    }
    buf.push('<input type="number" value="', value, '">');
    if (options.prefix || options.suffix) {
        if (options.suffix) buf.push('<span class="add-on">', options.suffix, '</span>');
        buf.push('</div>');
    }
    return buf.join('');
}