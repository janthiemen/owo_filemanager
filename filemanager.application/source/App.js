enyo.kind({
	name: "App",
	kind: "Panels",
	classes: "panels-sample-flickr-panels enyo-unselectable enyo-fit",
	arrangerKind: "CollapsingArranger",
	components: [
		{kind: "enyo.Signals", onbackbutton: "handleBackGesture"},
		{layoutKind: "FittableRowsLayout", components: [
			{kind: "PortsHeader", title: "File manager", classes: "enyo-fill", taglines: [
				"Really, I hate taglines'",
				"Look at all those files!",
				"why don\'t you mkdir?",
			]},
			{kind: "List", name: "mainList", fit: true, touch: true, onSetupItem: "buildList", components: [
                {name: "item", style: "padding: 10px;", dir: false, classes: "panels-sample-flickr-item enyo-border-box", onhold: "itemHold", ontap: "itemTap", components: [
					{name: "thumbnail", kind: "Image", classes: "panels-sample-flickr-thumbnail"},
					{name: "title", classes: "panels-sample-flickr-title"}
				]}
			]}
		]},
		{name: "itemView", fit: true, kind: "FittableRows", classes: "enyo-fit", components: [
			{kind: "onyx.Toolbar", components: [
				{name: "file_title", content: "Header"},
			]},
			{tag: "br"},
			{kind: "Scroller", horizontal: "hidden", classes: "scroller", fit: true, touch: true, components:[
				{fit: true, style: "position: relative;", name: "imageContainer",  showing: false, components: [
					{name: "imageItem", kind: "Image", classes: "enyo-fit panels-sample-flickr-center panels-sample-flickr-image"},
				]},
				{kind: "onyx.Groupbox", components: [
					{kind: "onyx.GroupboxHeader", content: "File information"},
					{name: "type", content: "Type: ", style: "padding: 8px; color: black;"},
					{name: "size", content: "Size: ", style: "padding: 8px; color: black;"},
					{name: "fileExtension", content: "File extension: ", style: "padding: 8px; color: black;"},
					{name: "full_path", content: "Full path: ", style: "padding: 8px; color: black;"},
				]},
				{kind:"onyx.Button", disabled: true, name: "removeButton", ontap: "remove", content: "Remove", classes: "onyx-negative"},
				{name: "mkDirPopup", kind: "onyx.Popup", floating: true, centered: true, style: "padding: 10px", components: [
					{kind: "onyx.InputDecorator", style: "color: black;", name: "newDirContainer", components: [
						{kind: "onyx.Input", style: "color: black;", name: "newDir",  placeholder: "Enter new folder name"}
					]},
					{kind:"onyx.Button", name: "createDirButton", ontap: "createDir", content: "Create folder", classes: "onyx-dark"}
				]},
				{kind:"onyx.Button", name: "createDirPopupButton", disabled: true, ontap: "createDirPopup", content: "New folder", classes: "onyx-dark"},
				{kind:"onyx.Button", name: "openFileButton", disabled: true, ontap: "openFileTap", content: "Open file", classes: "onyx-dark"},
				//not functional for now!
				{kind:"onyx.Button", name: "moveItemButton", disabled: true, ontap: "moveItemOpen", content: "Move", classes: "onyx-dark"},
				{name: "moveItemPopup", kind: "onyx.Popup", floating: true, centered: true, style: "padding: 10px", components: [
					{kind:"onyx.Button", name: "moveItemListButton", ontap: "moveItemSelectButton", content: "Select folder", classes: "onyx-dark"},
					{kind: "List", name: "moveList", fit: true, touch: true, onSetupItem: "buildMoveList", components: [
						{name: "itemMove", style: "padding: 10px;", dir: false, classes: "panels-sample-flickr-item enyo-border-box", ontap: "moveItemTap", components: [
							{name: "thumbnailMove", kind: "Image", classes: "panels-sample-flickr-thumbnail"},
							{name: "titleMove", classes: "panels-sample-flickr-title"}
						]}
					]}
				]},
				//functional again
				{name: "errorPopupBase", kind: "onyx.Popup", floating: true, centered: true, style: "padding: 10px", components: [
					{name: "errorPopup", content: "Popup..."}
				]}
			]}
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
			name: "openFile",
			kind: "enyo.PalmService",
			service: "luna://com.palm.applicationManager",
			method: "open",
			subscribe: true,
			onComplete: "openFileComplete"
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
	handleBackGesture: function(inSender, inEvent) {
		inEvent.stopPropagation();
		inEvent.preventDefault();
		this.setIndex(0);
	},
	//Not yet functional
	moveItemOpen: function(inSender, inEvent) {
		this.$.moveItemPopup.show();
		this.currentList = "move";
		this.currentMoveDir = "/media/internal";
		this.currentRequest = this.$.getDirs.send({"dir":this.currentMoveDir});
	},
	moveItemTap: function(inSender, inEvent) {
		this.selectedMoveItem = this.moveResults[inEvent.index];
		this.currentList = "move";
		
		if (this.selectedMoveItem.dir) {
			if (this.selectedMoveItem.title == "../") {
				//build the path of the underlying directory
				dirsArray = this.currentMoveDir.substring(1).split("/");
				var currentDirTemp = "";
				for (var i = 0; i < dirsArray.length-1; i++) {
					currentDirTemp += "/"+dirsArray[i];
				}
				if (currentDirTemp == "") currentDirTemp = "/";
				this.currentMoveDir = currentDirTemp;
			} else {
				this.currentMoveDir += "/"+this.selectedMoveItem.title;
			}
			this.currentRequest = this.$.getDirs.send({"dir":this.currentMoveDir});
		}
	},
	moveItemSelectButton: function(inSender, inEvent) {
		//TODO:
		//service: {"oldPath": this.selectedItem.full_path, "newPath": this.currentMoveDir}
	},
	initMoveList: function() {
		this.$.moveList.setCount(this.moveResults.length);
		this.$.moveList.reset();
	},
	buildMoveList: function(inSender, inEvent) {
		var i = inEvent.index;
		var item = this.moveResults[i];
		this.$.itemMove.addRemoveClass("onyx-selected", inSender.isSelected(inEvent.index));
        this.$.itemMove.dir = item.dir;
		this.$.thumbnailMove.setSrc(item.thumbnail);
		this.$.titleMove.setContent(item.title || "Untitled");
	},
	//functional again
	createDirPopup: function() {
		this.$.mkDirPopup.show();
	},
	initList: function() {
		this.$.mainList.setCount(this.results.length);
		this.$.mainList.reset();
	},
	rendered: function() {
		this.inherited(arguments);
		this.currentList = "main";
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
	enableButtons: function() {
		this.$.removeButton.setDisabled(false);
		this.$.createDirPopupButton.setDisabled(false);
		this.$.openFileButton.setDisabled(false);
	},
	
	handleItemTap: function() {
		this.currentList = "main";
		this.$.moveItemButton.setDisabled(false);
		this.enableButtons();
		
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
			this.$.fileExtension.hide();
			this.$.createDirButton.show();
			this.$.newDirContainer.show();
			this.$.openFileButton.hide();
			this.$.imageContainer.hide();
		} else {
			//TODO: check if screen is narrow, if, bring setIndex(1) to the front
			/*
			*
			*
			*
			*
			*
			*/
			this.currentRequest = this.$.logService.send({"data":"bestand"});
			this.selectedItem['full_path'] = this.currentDir+"/"+this.selectedItem.title;
			this.$.file_title.setContent(this.selectedItem.title);
			//Check if item is an image
			var fileExtensionArr =  this.selectedItem.title.split(".");
			var fileExtension = fileExtensionArr[fileExtensionArr.length -1].toLowerCase();
			this.$.fileExtension.show();
			this.$.fileExtension.setContent("File extension: "+fileExtension);
			if (fileExtension == "png" || fileExtension == "jpg" || fileExtension == "bmp") {
				this.$.imageContainer.show();
				this.currentRequest = this.$.logService.send({"Afbeelding":this.selectedItem.full_path});
				this.$.imageItem.setSrc(this.selectedItem.full_path);
				this.currentRequest = this.$.logService.send({"Afbeelding":this.$.imageItem.src});
			} else {
				this.$.imageContainer.hide();
			}
			this.$.type.setContent("Type: file");
			this.$.createDirButton.hide();
			this.$.newDirContainer.hide();
			this.$.openFileButton.show();
		}
		this.$.full_path.setContent(this.selectedItem.full_path);
		this.currentRequest = this.$.getFileSize.send({"path":this.selectedItem.full_path});
	},
	
	itemTap: function(inSender, inEvent) {
		this.selectedItem = this.results[inEvent.index];
		this.handleItemTap();
	},
	itemHold: function(inSender, inEvent) {
		this.selectedItem = this.results[inEvent.index];
		this.handleItemTap();
		this.setIndex(1);
	},
	getDirsComplete: function(inSender, inEvent) {
		var result = inEvent.data;
		var dirs = result.dirs.split(","); 
		var files = result.files.split(","); 
		if (this.currentList == "main") {
			this.results = [];
			this.results.push({'thumbnail': 'icon_folder.png','title':"../","dir":true});
			for (var i = 0; i < dirs.length; i++) {
				if (!dirs[i] == "") this.results.push({'thumbnail': 'icon_folder.png','title':dirs[i],"dir":true});
			}
			for (var i = 0; i < files.length; i++) {
				if (!files[i] == "") this.results.push({'thumbnail': 'icon_file.png','title':files[i],"dir":false});
			}
			this.initList();
		} else {
			this.moveResults = [];
			this.moveResults.push({'thumbnail': 'icon_folder.png','title':"../","dir":true});
			for (var i = 0; i < dirs.length; i++) {
				if (!dirs[i] == "") this.moveResults.push({'thumbnail': 'icon_folder.png','title':dirs[i],"dir":true});
			}
			this.initMoveList();
		}
	},
	remove: function(inSender, inEvent) {
		if (this.selectedItem.dir) {
			this.currentRequest = this.$.removeDir.send({"path":this.selectedItem.full_path});
		} else {
			this.currentRequest = this.$.removeFile.send({"path":this.selectedItem.full_path});
		}
		this.$.errorPopup.setContent('Folder deleted. Press "../" to go back.');
		this.$.errorPopupBase.show();
	},
	getFileSizeComplete: function(inSender, inEvent) {
		var size = inEvent.data.size;
		this.$.size.setContent("Size: "+size+" MB");
	},
	createDir: function(inSender, inEvent) {
		this.currentRequest = this.$.mkDir.send({"path":this.selectedItem.full_path+"/"+this.$.newDir.getValue()});
		this.$.mkDirPopup.hide();
		this.$.errorPopup.setContent("Folder created");
		this.$.errorPopupBase.show();
	},
	openFileTap: function(inSender, inEvent) {
		this.currentRequest = this.$.openFile.send({"target":"file://"+this.selectedItem.full_path});
	},
	openFileComplete: function(inSender, inEvent) {
		if (!inEvent.data.returnValue) {
			this.$.errorPopup.setContent(inEvent.data.errorText);
			this.$.errorPopupBase.show();
		}
	},
	showList: function() {
		this.setIndex(0);
	}
});
