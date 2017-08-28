/**
 * @author Sunil A S <sunils@ilimi.in>
 */
/* istanbul ignore next. Fabric extension - cannot be tested */

var generic_editor = function() {};
generic_editor.prototype.jQuery = window.$;
generic_editor.prototype._ = window._;
window.org.ekstep.genericeditor = new generic_editor();

window.ServiceConstants.GENERIC_EDITOR_SERVICE = "genericeditor";