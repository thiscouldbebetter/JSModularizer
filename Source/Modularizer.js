
function Modularizer()
{
	// do nothing
}
{
	// constants

	Modularizer.LineFeed = "\n";
	Modularizer.Newline = "\r\n";
	Modularizer.TokenForEndOfFunction = "}";
	Modularizer.TokenForStartOfFunction = "function ";
	Modularizer.TokenForScriptTagOpen = "<script";
	Modularizer.TokenForScriptTagClose = "</script";

	// methods

	Modularizer.prototype.processFile = function(file)
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

	Modularizer.prototype.demodularizeFile = function(file)
	{
		var modularizer = this;

		var fileReader = new FileReader();
		fileReader.onload = function(event)
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

	Modularizer.prototype.demodularizeTarFile = function(tarFile)
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
			bytesAsString, "Program.html"
		);
	}

	Modularizer.prototype.modularizeFile = function(file)
	{
		var modularizer = this;

		var fileReader = new FileReader();
		fileReader.onload = function(event)
		{
			var textFromFile = event.target.result;
			modularizer.modularizeCode(textFromFile);
		}
		fileReader.readAsText(file, "UTF-8");
	}

	Modularizer.prototype.modularizeCode = function(textFromFile)
	{
		this.filesSoFar = [];
		this.textForFileMaster = "";
		this.nameOfFunction = null;
		this.blocksForFunction = [];
		this.textForBlockCurrent = "";

		var textFromFileAsLines = textFromFile.split
		(
			Modularizer.LineFeed
		);

		var numberOfLines = textFromFileAsLines.length;

		for (var i = 0; i < numberOfLines; i++)
		{
			var lineFromFile = textFromFileAsLines[i];

			if (lineFromFile.startsWith(Modularizer.TokenForScriptTagClose))
			{
				break;
			}

			if (lineFromFile.startsWith(Modularizer.TokenForStartOfFunction))
			{
				this.processStartOfFunction(lineFromFile);
			}

			if (lineFromFile.startsWith(Modularizer.TokenForScriptTagOpen) == false)
			{
				this.textForBlockCurrent += 
					lineFromFile 
					+ Modularizer.LineFeed;
			}
			
			if (lineFromFile.startsWith(Modularizer.TokenForEndOfFunction))
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

		this.textForFileMaster += this.textForBlockCurrent;
		var fileForMaster = new FileWrapper
		(
			"_Master.html", false, this.textForFileMaster
		);
		this.filesSoFar.push(fileForMaster);

		var tarFile = TarFile.new();

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
			"Program.tar"
		);
	}

	Modularizer.prototype.processStartOfFunction = function(lineFromFile)
	{
		if (this.nameOfFunction == null)
		{
			this.textForFileMaster += this.textForBlockCurrent;
			this.textForBlockCurrent = "";
		}
		else if (this.textForBlockCurrent.length > 0)
		{
			var fileNameToSaveAs = this.nameOfFunction + ".js"

			var textForFileFunction = this.blocksForFunction.join
			(
				Modularizer.LineFeed
			);
			
			var file = new FileWrapper
			(
				fileNameToSaveAs, false, textForFileFunction
			);

			this.filesSoFar.push(file);
		}

		var indexAtEndOfFunctionName = lineFromFile.indexOf("(");
		if (indexAtEndOfFunctionName == -1)
		{
			indexAtEndOfFunctionName = lineFromFile.length - 1;
		}
				
		this.nameOfFunction = lineFromFile.substring
		(
			Modularizer.TokenForStartOfFunction.length,
			indexAtEndOfFunctionName
		);

		this.blocksForFunction = [];

		this.textForFileMaster += 
			"<script type=\"text/javascript\" src=\"" 
			+ this.nameOfFunction 
			+ ".js\">"
			+ "<" + "/script>" 
			+ Modularizer.Newline;

		this.textForFileFunction = "";
	}
}
