class ByteHelper
{
	static stringToBytes(stringToConvert)
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
