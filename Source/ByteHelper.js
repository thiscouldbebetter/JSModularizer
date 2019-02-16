
// classes

function ByteHelper()
{
	// static class
}

{
	ByteHelper.stringToBytes = function(stringToConvert)
	{
		var returnValues = [];

		for (var i = 0; i < stringToConvert.length; i++)
		{
			var charAsBytes = stringToConvert.charCodeAt(i);
			returnValues.push(charAsBytes);
		}

		return returnValues;
	}
}
