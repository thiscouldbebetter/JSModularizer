
class Modularizer
{
	constructor()
	{
		this.LineFeed = "\n";
		this.Newline = "\r\n";
		this.TokenForEndOfClassOrFunction = "}";
		this.TokenForStartOfClass = "class ";
		this.TokenForStartOfFunction = "function ";
		this.TokenForScriptTagOpen = "<script";
		this.TokenForScriptTagClose = "</script";
	}

	// methods

	processFile(file)
	{
		var fileType = file.type;
		if (fileType == "application/x-tar")
		{
			this.demodularizeFile(file);
		}
		else if (fileType == "text/html")
		{
			this.modularizeFile(file);
		}
		else
		{
			alert("Unrecognized file type!");
		}
	}

	demodularizeFile(file)
	{
		var modularizer = this;

		var fileReader = new FileReader();
		fileReader.onload = (event) =>
		{
			var tarFileAsBinaryString = event.target.result;
			var tarFileAsBytes = [];
			for (var i = 0; i < tarFileAsBinaryString.length; i++)
			{
				var byteRead = tarFileAsBinaryString.charCodeAt(i);
				tarFileAsBytes.push(byteRead);
			}
			var tarFile = TarFile.fromBytes("todo", tarFileAsBytes);
			modularizer.demodularizeTarFile(tarFile);
		}
		fileReader.readAsBinaryString(file, "UTF-8");
	}

	demodularizeTarFile(tarFile)
	{
		var bytesForAllEntriesSoFar = [];
	
		var tarFileEntries = tarFile.entries;
		tarFileEntries = tarFileEntries.filter
		(
			function(x) {  return (x.isDirectory() == false && x.header.fileName.endsWith(".js")); }
		);
		tarFileEntries = tarFileEntries.sort
		(
			function(x, y) { return (x.header.fileName <= y.header.fileName ? -1 : 1); }
		);

		for (var i = 0; i < tarFileEntries.length; i++)
		{
			var entry = tarFileEntries[i];
			var entryDataAsBytes = entry.dataAsBytes;
			bytesForAllEntriesSoFar =
				bytesForAllEntriesSoFar.concat(entryDataAsBytes);
		}

		var bytesAsString = "<html><body><script type='text/javascript'>\n\n";
		for (var i = 0; i < bytesForAllEntriesSoFar.length; i++)
		{
			var byteToConvert = bytesForAllEntriesSoFar[i];
			var byteAsChar = String.fromCharCode(byteToConvert);
			bytesAsString += byteAsChar;
		}
		bytesAsString += "\n\nmain();\n\n";
		bytesAsString += "</script></body></html>";

		FileHelper.saveTextAsFile
		(
			bytesAsString, "Demodularized.html"
		);
	}

	modularizeFile(file)
	{
		var modularizer = this;

		var fileReader = new FileReader();
		fileReader.onload = (event) =>
		{
			var textFromFile = event.target.result;
			modularizer.modularizeCode(textFromFile);
		}
		fileReader.readAsText(file, "UTF-8");
	}

	modularizeCode(textFromFile)
	{
		this.filesSoFar = [];
		this.textForFileMain = "";
		this.nameOfFunction = null;
		this.blocksForFunction = [];
		this.textForBlockCurrent = "";

		var textFromFileAsLines = textFromFile.split
		(
			this.LineFeed
		);

		var numberOfLines = textFromFileAsLines.length;

		for (var i = 0; i < numberOfLines; i++)
		{
			var lineFromFile = textFromFileAsLines[i];

			if (lineFromFile.startsWith(this.TokenForScriptTagClose))
			{
				for (var j = i; j < numberOfLines; j++)
				{
					var line = textFromFileAsLines[j];
					this.textForBlockCurrent += line + this.Newline;
				}
				break;
			}
			else if (lineFromFile.startsWith(this.TokenForStartOfClass))
			{
				var isClassNotFunctionTrue = true;
				this.processStartOfClassOrFunction(lineFromFile, isClassNotFunctionTrue);
			}
			else if (lineFromFile.startsWith(this.TokenForStartOfFunction))
			{
				var isClassNotFunctionFalse = false;
				this.processStartOfClassOrFunction(lineFromFile, isClassNotFunctionFalse);
			}

			if (lineFromFile.startsWith(this.TokenForScriptTagOpen) == false)
			{
				this.textForBlockCurrent += 
					lineFromFile 
					+ this.LineFeed;
			}

			if (lineFromFile.startsWith(this.TokenForEndOfClassOrFunction))
			{
				this.blocksForFunction.push
				(
					this.textForBlockCurrent
				);
				this.textForBlockCurrent = "";
			}
		}

		var textForFileFunction = "";
		for (var b = 0; b < this.blocksForFunction.length; b++)
		{
			textForFileFunction += this.blocksForFunction[b];
		}
		var fileNameToSaveAs = this.nameOfFunction + ".js";
		var fileForFunction = new FileWrapper
		(
			fileNameToSaveAs, false, textForFileFunction
		);
		this.filesSoFar.push(fileForFunction);

		this.textForFileMain += this.textForBlockCurrent;
		var fileForMain = new FileWrapper
		(
			"_Main.html", false, this.textForFileMain
		);
		this.filesSoFar.push(fileForMain);

		var tarFile = TarFile.create();

		for (var i = 0; i < this.filesSoFar.length; i++)
		{
			var file = this.filesSoFar[i];

			var fileContentsAsBytes = ByteHelper.stringToBytes
			(
				file.contents
			);

			var fileAsTarEntry = TarFileEntry.fileNew
			(
				file.name,
				fileContentsAsBytes
			);

			tarFile.entries.push(fileAsTarEntry);
		}

		var tarFileAsBytes = tarFile.toBytes();

		FileHelper.saveBytesAsFile
		(
			tarFileAsBytes,
			"Modularized.tar"
		);
	}

	processStartOfClassOrFunction(lineFromFile, isClassNotFunction)
	{
		if (this.nameOfFunction == null)
		{
			this.textForFileMain += this.textForBlockCurrent;
			this.textForBlockCurrent = "";
		}
		else if (this.textForBlockCurrent.length > 0)
		{
			var fileNameToSaveAs = this.nameOfFunction + ".js"

			var textForFileFunction = this.blocksForFunction.join
			(
				this.LineFeed
			);

			var file = new FileWrapper
			(
				fileNameToSaveAs, false, textForFileFunction
			);

			this.filesSoFar.push(file);
		}

		var indexAtStartOfClassOrFunctionName =
		(
			isClassNotFunction
			? this.TokenForStartOfClass.length
			: this.TokenForStartOfFunction.length
		);
		var indexAtEndOfClassOrFunctionName = lineFromFile.indexOf("(");
		if (indexAtEndOfClassOrFunctionName == -1)
		{
			indexAtEndOfClassOrFunctionName = lineFromFile.length - 1;
		}

		this.nameOfFunction = lineFromFile.substring
		(
			indexAtStartOfClassOrFunctionName,
			indexAtEndOfClassOrFunctionName
		);

		this.blocksForFunction = [];

		this.textForFileMain +=
			"<script type=\"text/javascript\" src=\"" 
			+ this.nameOfFunction 
			+ ".js\">"
			+ "<" + "/script>" 
			+ this.Newline;

		this.textForFileFunction = "";
	}
}
