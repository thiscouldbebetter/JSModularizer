
function FileHelper()
{}
{
	FileHelper.loadFileAsBinaryString = function(fileToLoad, contextForCallback, callback)
	{	
		var fileReader = new FileReader();
		fileReader.onloadend = function(fileLoadedEvent)
		{
			var returnValue = null;

			if (fileLoadedEvent.target.readyState == FileReader.DONE)
			{
				returnValue = fileLoadedEvent.target.result;
			}

			callback.call
			(
				contextForCallback, 
				fileToLoad,
				returnValue
			);
		}

		fileReader.readAsBinaryString(fileToLoad);
	}

	FileHelper.saveBytesAsFile = function(bytesToWrite, fileNameToSaveAs)
	{
		var bytesToWriteAsArrayBuffer = new ArrayBuffer(bytesToWrite.length);
		var bytesToWriteAsUIntArray = new Uint8Array(bytesToWriteAsArrayBuffer);
		for (var i = 0; i < bytesToWrite.length; i++) 
		{
			bytesToWriteAsUIntArray[i] = bytesToWrite[i];
		}

		var bytesToWriteAsBlob = new Blob
		(
			[ bytesToWriteAsArrayBuffer ], 
			{ type:"application/type" }
		);

		var downloadLink = document.createElement("a");
		downloadLink.download = fileNameToSaveAs;
		downloadLink.innerHTML = "Download File";
		downloadLink.href = window.URL.createObjectURL(bytesToWriteAsBlob);
		downloadLink.onclick = FileHelper.destroyClickedElement;
		downloadLink.style.display = "none";
		document.body.appendChild(downloadLink);	
		downloadLink.click();
	}

	FileHelper.saveTextAsFile = function(textToSave, fileNameToSaveTo)
	{
		var textToSaveAsBlob = new Blob([textToSave], {type:"text/plain"});
		var textToSaveAsURL = window.URL.createObjectURL(textToSaveAsBlob);
	
		var downloadLink = document.createElement("a");
		downloadLink.download = fileNameToSaveTo;
		downloadLink.innerHTML = "Download File";
		downloadLink.href = textToSaveAsURL;
		downloadLink.onclick = function(event) 
		{ 
			document.body.removeChild(event.target); 
		}
		downloadLink.style.display = "none";
		document.body.appendChild(downloadLink);
		downloadLink.click();
	}

}
