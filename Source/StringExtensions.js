
// extensions

function StringExtensions()
{
	// extension class
}

{
	String.prototype.padLeft = function(lengthToPadTo, characterToPadWith)
	{
		var result = this;
		
		if (characterToPadWith == null)
		{
			characterToPadWith = " ";
		}
	
		while (result.length < lengthToPadTo)
		{
			result = characterToPadWith + result;
		}
		
		return result;
	}

	String.prototype.padRight = function(lengthToPadTo, characterToPadWith)
	{
		var result = this;
		
		if (characterToPadWith == null)
		{
			characterToPadWith = " ";
		}
	
		while (result.length < lengthToPadTo)
		{
			result += characterToPadWith;
		}
		
		return result;
	}
}
