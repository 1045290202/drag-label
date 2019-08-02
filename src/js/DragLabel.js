//找出元素在数组中的第几个
Array.prototype.indexOf = function (val) {
	for (let i = 0; i < this.length; i++) {
		if (this[i] === val) return i;
	}
	return -1;
};

//删除数组中第几个元素
Array.prototype.remove = function (val) {
	let index = this.indexOf(val);
	if (index > -1) {
		this.splice(index, 1);
	}
};

class DragLabel {
	constructor(dragViewId, draggedViewId, {
		deletable = true,//是否允许删除
		regExps = [/\s/g],//拖拽时要替换的内容
		writable = false,//是否允许用户编辑内容
		maxLength = -1,//拖拽时字符串最大长度
	} = {}) {
		this.dragViewId = dragViewId;//生成标签的id
		this.draggedViewId = draggedViewId;//允许拖拽文本的id
		this.options = {deletable, regExps, writable, maxLength};//选项
		this.labels = [];
		this.nodes = [];
		this.iNodes = [];
		this.inputNodes = [];
	}

	//拖动监听
	addDragListener({
		                overstep = null,
		                empty = null,
		                success = null,
	                } = {}, callback = (tip, text) => {
	}) {
		document.addEventListener("dragstart", (e) => {
			let element = e.target;
			e.dataTransfer.setData("class", element.parentNode.className);//存入类名

			let parentNodes = getParentNodes(element);
			let isDraggedView = parentNodes.some((value, index, array) => {
				return value.id === this.draggedViewId;
			});
			e.dataTransfer.setData("isDraggedView", isDraggedView.toString());//存入是否是允许拖动的文本
		});

		document.addEventListener("dragover", (e) => {
			e.preventDefault();
		});

		document.addEventListener("drop", (e) => {
			e.stopPropagation();//阻止浏览器默认拖入事件，如firefox
			e.preventDefault();

			let element = e.target;
			let text = e.dataTransfer.getData("text");
			this.options.regExps.forEach((value, index, array) => {
				text = text.replace(value, "");
			});
			if (this.options.maxLength >= 0 && text.length > this.options.maxLength) {
				callback(overstep, text);//字符串过长回调
				return;
			} else if (text.length === 0) {
				callback(empty, text);//空字符串回调
				return;
			}

			//创建span元素
			let node = document.createElement("span");
			node.className = DragLabel.spanClass;

			//创建span元素并写入内容
			let spanNode = document.createElement("span");
			spanNode.innerText = text;
			spanNode.className = DragLabel.inputClass;
			if (this.options.writable) {
				spanNode.contentEditable = "true";//"plaintext-only"
			} else {
				spanNode.contentEditable = "false";
			}
			node.appendChild(spanNode);

			//创建删除按钮
			let iNode = document.createElement("i");
			iNode.onclick = () => {
				node.remove();
				this.nodes.remove(node);
				this.iNodes.remove(iNode);
			};
			if (this.options.deletable) {
				iNode.classList.remove(DragLabel.hiddenClass);
			} else {
				iNode.classList.add(DragLabel.hiddenClass);
			}
			iNode.className = DragLabel.iClass;
			iNode.setAttribute("aria-hidden", "true");
			this.iNodes.push(iNode);
			node.appendChild(iNode);

			if (e.dataTransfer.getData("isDraggedView") === "false") {
				return;
			}

			//仅允许指定id的元素中的文本可被拖入
			if (element.id === this.dragViewId && e.dataTransfer.getData("class") !== DragLabel.spanClass) {
				element.appendChild(node);
				this.labels.push(text);
				this.nodes.push(node);
			} else if (element.parentNode.className === DragLabel.spanClass) {
				element.parentNode.parentNode.appendChild(node);
				this.labels.push(text);
				this.nodes.push(node);
			} else if (element.className === DragLabel.spanClass) {
				element.parentNode.appendChild(node);
				this.labels.push(text);
				this.nodes.push(node);
			}

			//成功回调
			callback(success, text);
		});
	}

	//设置能否删除
	setNodesDeletable(deletable) {
		this.options.deletable = deletable;
		this.iNodes.forEach((value, index, array) => {
			let iNode = value;
			if (deletable) {
				iNode.classList.remove(DragLabel.hiddenClass);
			} else {
				iNode.classList.add(DragLabel.hiddenClass);
			}
		});
	}

	//设置能否编辑
	setNodesWritable(writable) {
		this.options.writable = writable;
		this.inputNodes.forEach((value, index, array) => {
			let inputNode = value;
			if (writable) {
				inputNode.contentEditable = "true";
			} else {
				inputNode.contentEditable = "false";
			}
		});
	}
}

DragLabel.spanClass = "spanClass";
DragLabel.hiddenClass = "hiddenClass";
DragLabel.inputClass = "inputClass";
DragLabel.iClass = "iClass";
[{
	name: DragLabel.spanClass,
	data: "drag-label",
	configurable: false,
	writable: false,
}, {
	name: DragLabel.inputClass,
	data: "drag-input",
	configurable: false,
	writable: false,
}, {
	name: DragLabel.hiddenClass,
	data: "drag-hidden",
	configurable: false,
	writable: false,
}, {
	name: DragLabel.iClass,
	data: "fa fa-times drag-remove",
	configurable: false,
	writable: false,
}].forEach(function (value, index, array) {
	Object.defineProperty(DragLabel, value.name, {
		configurable: value.configurable,
		writable: value.writable,
		value: value.data,
	});
});

//获取元素的所有父节点
let getParentNodes = function f(startTag, parentList = []) {
	if (startTag.parentElement.nodeName !== "BODY") {
		parentList.push(startTag.parentElement);
		return f(startTag.parentElement, parentList);
	} else {
		return parentList;
	}
};
