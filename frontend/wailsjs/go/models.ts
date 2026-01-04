export namespace main {
	
	export class CanvasConfig {
	    width: number;
	    height: number;
	    flexible: boolean;
	    title: string;
	
	    static createFrom(source: any = {}) {
	        return new CanvasConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.width = source["width"];
	        this.height = source["height"];
	        this.flexible = source["flexible"];
	        this.title = source["title"];
	    }
	}
	export class ElementProperties {
	    text?: string;
	    placeholder?: string;
	    options?: string;
	    style?: string;
	
	    static createFrom(source: any = {}) {
	        return new ElementProperties(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.text = source["text"];
	        this.placeholder = source["placeholder"];
	        this.options = source["options"];
	        this.style = source["style"];
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
	    properties: ElementProperties;
	
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
	        this.properties = this.convertValues(source["properties"], ElementProperties);
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
	export class GUIDesign {
	    canvas: CanvasConfig;
	    elements: GUIElement[];
	
	    static createFrom(source: any = {}) {
	        return new GUIDesign(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.canvas = this.convertValues(source["canvas"], CanvasConfig);
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

