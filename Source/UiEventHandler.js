
class UiEventHandler
{
	static inputFileToLoad_OnChange()
	{
		var inputFileToLoad = document.getElementById("inputFileToLoad");
		var fileToLoad = inputFileToLoad.files[0];
		new Modularizer().processFile(fileToLoad);
	}
}
