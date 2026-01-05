export namespace main {
	
	export class CanvasConfig {
	    width: number;
	    height: number;
	    flexible: boolean;
	    title: string;
	    bgColor: string;
	
	    static createFrom(source: any = {}) {
	        return new CanvasConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.width = source["width"];
	        this.height = source["height"];
	        this.flexible = source["flexible"];
	        this.title = source["title"];
	        this.bgColor = source["bgColor"];
	    }
	}
	export class GUIElement {
	    id: string;
	    type: string;
	    name: string;
	    description: string;
	    x: number;
	    y: number;
	    width: number;
	    height: number;
	    zIndex: number;
	    properties: Record<string, any>;
	
	    static createFrom(source: any = {}) {
	        return new GUIElement(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.type = source["type"];
	        this.name = source["name"];
	        this.description = source["description"];
	        this.x = source["x"];
	        this.y = source["y"];
	        this.width = source["width"];
	        this.height = source["height"];
	        this.zIndex = source["zIndex"];
	        this.properties = source["properties"];
	    }
	}
	export class ProjectSettings {
	    windowBg: string;
	    componentBg: string;
	    componentText: string;
	    inputBg: string;
	    inputText: string;
	    componentBgTransparent: boolean;
	
	    static createFrom(source: any = {}) {
	        return new ProjectSettings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.windowBg = source["windowBg"];
	        this.componentBg = source["componentBg"];
	        this.componentText = source["componentText"];
	        this.inputBg = source["inputBg"];
	        this.inputText = source["inputText"];
	        this.componentBgTransparent = source["componentBgTransparent"];
	    }
	}
	export class GUIDesign {
	    canvas: CanvasConfig;
	    settings: ProjectSettings;
	    elements: GUIElement[];
	
	    static createFrom(source: any = {}) {
	        return new GUIDesign(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.canvas = this.convertValues(source["canvas"], CanvasConfig);
	        this.settings = this.convertValues(source["settings"], ProjectSettings);
	        this.elements = this.convertValues(source["elements"], GUIElement);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	

}

export namespace xml {
	
	export class Name {
	    Space: string;
	    Local: string;
	
	    static createFrom(source: any = {}) {
	        return new Name(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Space = source["Space"];
	        this.Local = source["Local"];
	    }
	}

}

