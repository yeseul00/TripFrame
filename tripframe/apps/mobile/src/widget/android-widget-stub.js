// 웹 빌드 시 react-native-android-widget 전체를 대체하는 no-op stub
exports.registerWidgetTaskHandler = function () {};
exports.requestWidgetUpdate = function () { return Promise.resolve(); };
exports.FlexWidget = function () { return null; };
exports.TextWidget = function () { return null; };
exports.ImageWidget = function () { return null; };
exports.ListWidget = function () { return null; };
exports.SvgWidget = function () { return null; };
exports.AndroidWidget = {};
