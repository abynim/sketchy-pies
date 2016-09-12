var sketchVersion;

var onRun = function(context) {
  
	var selection = context.selection
	if(selection.count() == 0) {
		var app = NSApplication.sharedApplication();
    		app.displayDialog_withTitle("Draw a circle on the canvas, select it, then run the plugin again.", "Select a circle!")
		return
	}

	var doc = context.document,
	sliceColorsString = doc.askForUserInput_initialValue("Enter color values for pie slices.", "#161032,#FAFF81,#FFC53A,#E06D06,#B26700");
	if(sliceColorsString == nil) return

	sketchVersion = getSketchVersionNumber();

	var layer = selection.firstObject(),
	sliceColors = sliceColorsString.split(","),
	numSlices = sliceColors.length,
	diameter = layer.frame().width(),
	dash = diameter*22/7/numSlices,
	gap = diameter*5,
	rotateBy = 360/numSlices,
	allLayers = [layer],
	slice, borders, border, color;

	disableFills(layer);

	for(var i = 0; i<numSlices; i++) {
		color = hexToColor(sliceColors[i])
		slice = layer.duplicate()
		disableFills(slice);
		if (sketchVersion >= 380) {
			border = slice.style().addStylePartOfType(1);
		} else {
			borders = slice.style().borders();
			borders.addNewStylePart();
			border = slice.style().border();
		}
		border.setColor(MSColor.colorWithNSColor(color));
		border.setPosition(1); //inside
		border.setThickness(diameter/2);
		slice.style().borderOptions().setDashPattern([dash, gap])
		slice.setRotation(rotateBy*i)
		slice.setName(sliceColors[i])
		allLayers.push(slice);
	}

	layer.setHasClippingMask(1);
	var layers = MSLayerArray.arrayWithLayers(allLayers);
	var newGroup = MSLayerGroup.groupFromLayers(layers);
	newGroup.setName(numSlices + " Slices Pie Chart");

}

var disableFills = function(aLayer) {
	var fills = sketchVersion >= 380 ? aLayer.style().fills() : aLayer.style().fills().array();
	var loop = fills.objectEnumerator();
	while(existingFill = loop.nextObject()) {
		existingFill.setIsEnabled(false)
	}
}

var hexToColor = function(hex, alpha) {
	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex),
		red = parseInt(result[1], 16) / 255,
		green = parseInt(result[2], 16) / 255,
		blue = parseInt(result[3], 16) / 255,
		alpha = (typeof alpha !== 'undefined') ? alpha : 1;
	return NSColor.colorWithCalibratedRed_green_blue_alpha(red, green, blue, alpha);
}

var getSketchVersionNumber = function() {
	var version = NSBundle.mainBundle().objectForInfoDictionaryKey("CFBundleShortVersionString");
	var versionNumber = version.stringByReplacingOccurrencesOfString_withString(".", "") + ""
	while(versionNumber.length != 3) {
		versionNumber += "0"
	}
	return parseInt(versionNumber)
}