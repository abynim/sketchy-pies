var sketchVersion;

var onRun = function(context) {
  
	var selection = context.selection
	if(selection.count() == 0) {
		NSApplication.sharedApplication().displayDialog_withTitle("Draw a circle on the canvas, select it, then run the plugin again.", "Select a circle!")
		return
	}

	var layer = selection.firstObject(),
		diameter = layer.frame().width();
	if (layer.className() != "MSShapeGroup" || diameter != layer.frame().height()) {
		NSApplication.sharedApplication().displayDialog_withTitle("This only works when you have a Circle Shape layer selected. Width and Height must be equal.", "Select a circle!");
		return
	};
	
	var doc = context.document,
	identifier = context.command.identifier(),
	defaultValues = identifier == "convertToPieChartWithPercent" ? "#161032:20%, #FAFF81:0.2, #FFC53A:40%, #E06D06:.1, #B26700:10%" : "#161032,#FAFF81,#FFC53A,#E06D06,#B26700",
	infoText = identifier == "convertToPieChartWithPercent" ? "Enter #hex:percentage values for pie slices." : "Enter #hex values for pie slices.",
	sliceColorsString = doc.askForUserInput_initialValue(infoText, defaultValues);
	if(sliceColorsString == nil) return

	sliceColorsString = sliceColorsString.stringByReplacingOccurrencesOfString_withString(" ", "").stringByReplacingOccurrencesOfString_withString("(", "").stringByReplacingOccurrencesOfString_withString(")", "")
	sketchVersion = getSketchVersionNumber();

	var sliceColors = sliceColorsString.split(","),
	numSlices = sliceColors.length,
	allLayers = [layer],
	dash, gap, rotateBy, slice, borders, border, color, firstValue;

 	firstValue = sliceColors[0];
	if(firstValue.split(":").length == 2) {
		// colors and %
		rotateBy = 0;
		var sliceValues, sliceValueString, sliceValue;

		for(var i = 0; i<numSlices; i++) {
			sliceValues = sliceColors[i].split(":");
			color = MSColor.colorWithSVGString(sliceValues[0]);
			sliceValueString = sliceValues[1];
			sliceValue = parseFloat(sliceValueString);
			if (sliceValueString.endsWith("%")) {
				sliceValue /= 100;
			};
			slice = layer.duplicate();
			disableFills(slice);
			if (sketchVersion >= 380) {
				border = slice.style().addStylePartOfType(1);
			} else {
				borders = slice.style().borders();
				borders.addNewStylePart();
				border = slice.style().border();
			}
			border.setColor(color);
			border.setPosition(1); //inside
			border.setThickness(diameter/2);

			dash = diameter*22/7*sliceValue;
			gap = diameter*5;

			slice.style().borderOptions().setDashPattern([dash, gap])
			slice.setRotation(rotateBy)
			rotateBy += 360*sliceValue;

			slice.setName(sliceColors[i])
			allLayers.push(slice);
		}

	} else {
		// colors only
		dash = diameter*22/7/numSlices;
		gap = diameter*5;
		rotateBy = 360/numSlices;

		for(var i = 0; i<numSlices; i++) {
			color = MSColor.colorWithSVGString(sliceColors[i]);
			slice = layer.duplicate();
			disableFills(slice);
			if (sketchVersion >= 380) {
				border = slice.style().addStylePartOfType(1);
			} else {
				borders = slice.style().borders();
				borders.addNewStylePart();
				border = slice.style().border();
			}
			border.setColor(color);
			border.setPosition(1); //inside
			border.setThickness(diameter/2);
			slice.style().borderOptions().setDashPattern([dash, gap])
			slice.setRotation(rotateBy*i)
			slice.setName(sliceColors[i])
			allLayers.push(slice);
		}
	}
	disableFills(layer);

	

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

var getSketchVersionNumber = function() {
	var version = NSBundle.mainBundle().objectForInfoDictionaryKey("CFBundleShortVersionString");
	var versionNumber = version.stringByReplacingOccurrencesOfString_withString(".", "") + ""
	while(versionNumber.length != 3) {
		versionNumber += "0"
	}
	return parseInt(versionNumber)
}