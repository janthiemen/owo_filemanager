enyo.kind({
	name: "App",
	kind: "Panels",
	classes: "panels-sample-flickr-panels enyo-unselectable enyo-fit",
	arrangerKind: "CollapsingArranger",
	components: [
		{layoutKind: "FittableRowsLayout", components: [
			{kind: "PortsHeader", title: "File manager", classes: "enyo-fill", taglines: [
				"Really, I hate taglines'",
				"Look at all those files!",
				"why don\'t you mkdir?",
			]},
			{kind: "List", fit: true, touch: true, onSetupItem: "buildList", components: [
                {name: "item", style: "padding: 10px;", dir: false, classes: "panels-sample-flickr-item enyo-border-box", ontap: "itemTap", components: [
					{name: "thumbnail", kind: "Image", classes: "panels-sample-flickr-thumbnail"},
					{name: "title", classes: "panels-sample-flickr-title"}
				]}
			]}
		]},
		{name: "pictureView", fit: true, kind: "FittableRows", classes: "enyo-fit", components: [
			{kind: "onyx.Toolbar", components: [
				{name: "file_title", content: "Header"},
			]},
			{tag: "br"},
			{kind: "onyx.Groupbox", components: [
				{kind: "onyx.GroupboxHeader", content: "File information"},
				{name: "type", content: "Type: ", style: "padding: 8px; color: black;"},
				{name: "size", content: "Size: ", style: "padding: 8px; color: black;"},
				{name: "full_path", content: "Full path: ", style: "padding: 8px; color: black;"}
			]},
			{kind:"onyx.Button", ontap: "remove", content: "Remove", classes: "onyx-negative"},
			{kind: "onyx.InputDecorator", components: [
				{kind: "onyx.Input", name: "newDir", placeholder: "Enter new folder name"}
			]},
			{kind:"onyx.Button", name: "createDirButton", ontap: "createDir", content: "Create folder", classes: "onyx-dark"}
		]},
		{
			name: "getDirs",
			kind: "enyo.PalmService",
			service: "luna://nl.kappline.owofm.service",
			method: "GetDirectories",
			subscribe: true,
			onComplete: "getDirsComplete"
        },
		{
			name: "removeDir",
			kind: "enyo.PalmService",
			service: "luna://nl.kappline.owofm.service",
			method: "removeDir",
			subscribe: true,
			onComplete: "removeDirComplete"
        },
		{
			name: "mkDir",
			kind: "enyo.PalmService",
			service: "luna://nl.kappline.owofm.service",
			method: "mkDir",
			subscribe: true,
			onComplete: "mkDirComplete"
        },
		{
			name: "removeFile",
			kind: "enyo.PalmService",
			service: "luna://nl.kappline.owofm.service",
			method: "removeFile",
			subscribe: true,
			onComplete: "removeFileComplete"
        },
		{
			name: "getFileSize",
			kind: "enyo.PalmService",
			service: "luna://nl.kappline.owofm.service",
			method: "getFileSize",
			subscribe: true,
			onComplete: "getFileSizeComplete"
        },
		{
			name: "logService",
			kind: "enyo.PalmService",
			service: "luna://nl.kappline.owofm.service",
			method: "ListLicensesForPackageAssistant",
			subscribe: true,
			onComplete: "logServiceComplete"
        }
	],
	initList: function() {
		this.$.list.setCount(this.results.length);
		this.$.list.reset();
	},
	rendered: function() {
		this.inherited(arguments);
		this.currentDir = "/media/internal";
		this.currentRequest = this.$.getDirs.send({"dir":this.currentDir});
	},
	reflow: function() {
		this.inherited(arguments);
	},
	buildList: function(inSender, inEvent) {
		var i = inEvent.index;
		var item = this.results[i];
		this.$.item.addRemoveClass("onyx-selected", inSender.isSelected(inEvent.index));
        this.$.item.dir = item.dir;
		this.$.thumbnail.setSrc(item.thumbnail);
		this.$.title.setContent(item.title || "Untitled");
	},
	itemTap: function(inSender, inEvent) {
		this.selectedItem = this.results[inEvent.index];
		
		if (this.selectedItem.dir) {
			if (this.selectedItem.title == "../") {
				//build the path of the underlying directory
				dirsArray = this.currentDir.substring(1).split("/");
				var currentDirTemp = "";
				for (var i = 0; i < dirsArray.length-1; i++) {
					currentDirTemp += "/"+dirsArray[i];
				}
				if (currentDirTemp == "") currentDirTemp = "/";
				this.currentDir = currentDirTemp;
				this.$.file_title.setContent(this.currentDir);
			} else {
				this.currentDir += "/"+this.selectedItem.title;
				this.$.file_title.setContent(this.selectedItem.title);
			}
			this.currentRequest = this.$.getDirs.send({"dir":this.currentDir});
			this.selectedItem['full_path'] = this.currentDir;
			this.$.type.setContent("Type: folder");
			this.$.createDirButton.setDisabled(false);
		} else {
			this.currentRequest = this.$.logService.send({"data":"bestand"});
			this.selectedItem['full_path'] = this.currentDir+"/"+this.selectedItem.title;
			this.$.file_title.setContent(this.selectedItem.title);
			this.$.type.setContent("Type: file");
			this.$.createDirButton.setDisabled(true);
		}
		this.$.full_path.setContent(this.selectedItem.full_path);
		this.currentRequest = this.$.getFileSize.send({"path":this.selectedItem.full_path});
	},
	getDirsComplete: function(inSender, inEvent) {
		var result = inEvent.data;
		var dirs = result.dirs.split(","); 
		var files = result.files.split(","); 
		this.results = [];
		this.results.push({'thumbnail': 'icon_folder.png','title':"../","dir":true});
		for (var i = 0; i < dirs.length; i++) {
			if (!dirs[i] == "") this.results.push({'thumbnail': 'icon_folder.png','title':dirs[i],"dir":true});
		}
		for (var i = 0; i < files.length; i++) {
			if (!files[i] == "") this.results.push({'thumbnail': 'icon_file.png','title':files[i],"dir":false});
		}
        this.initList();
	},
	remove: function(inSender, inEvent) {
		if (this.selectedItem.dir) {
			this.currentRequest = this.$.removeDir.send({"path":this.selectedItem.full_path});
		} else {
			this.currentRequest = this.$.removeFile.send({"path":this.selectedItem.full_path});
		}
	},
	getFileSizeComplete: function(inSender, inEvent) {
		var size = inEvent.data.size;
		this.$.size.setContent("Size: "+size+" MB");
	},
	createDir: function(inSender, inEvent) {
		this.currentRequest = this.$.mkDir.send({"path":this.selectedItem.full_path+"/"+this.$.newDir.getValue()});
	},
	showList: function() {
		this.setIndex(0);
	}
});
