import { I18n } from "./i18n.service";
import { isObservable, BehaviorSubject } from "rxjs";

const EN = require("./en.json");

let service;

describe("i18n service", () => {
	beforeEach(() => {
		service = new I18n();
	});

	it("should translate a string", done => {
		service.get("BANNER.CLOSE_BUTTON").subscribe(value => {
			expect(value).toBe(EN.BANNER.CLOSE_BUTTON);
			done();
		});
	});

	it("should update strings", done => {
		service.set({ "BANNER": { "CLOSE_BUTTON": "test" }});

		service.get("BANNER.CLOSE_BUTTON").subscribe(value => {
			expect(value).toBe("test");
			done();
		});
	});

	it("should emit updated string", () => {
		const subject = service.get("BANNER.CLOSE_BUTTON");

		const spy = spyOn(subject, "next");

		service.set({ "BANNER": { "CLOSE_BUTTON": "test" } });

		expect(spy).toHaveBeenCalled();
	});

	it("should replace variables", done => {
		service.set({ "TEST": "{{foo}} bar"});

		service.replace(service.get("TEST"), {foo: "test"}).subscribe(value => {
			expect(value).toBe("test bar");
			done();
		});
	});

	it("should replace variables ignoring spaces", done => {
		service.set({ "TEST": "{{     foo         }} bar" });

		service.replace(service.get("TEST"), { foo: "test" }).subscribe(value => {
			expect(value).toBe("test bar");
			done();
		});
	});

	it("should replace multiple of the same variable", done => {
		service.set({ "TEST": "{{foo}} {{foo}}" });

		service.replace(service.get("TEST"), { foo: "test" }).subscribe(value => {
			expect(value).toBe("test test");
			done();
		});
	});

	it("should replace multiple variables", done => {
		service.set({ "TEST": "{{foo}} {{bar}}" });

		service.replace(service.get("TEST"), { foo: "test", bar: "asdf" }).subscribe(value => {
			expect(value).toBe("test asdf");
			done();
		});
	});

	it("should keep the default translation strings", () => {
		service.set({ "BANNER": { "TEST": "TEST" } });

		expect(service.get().BANNER.CLOSE_BUTTON).toBe(EN.BANNER.CLOSE_BUTTON);
		expect(service.get().BANNER.TEST).toBe("TEST");
	});

	it("should return a whole subtree as observables", () => {
		service.set({"TEST": { "ONE": "ONE", "TWO": "TWO", "THREE": "THREE"}});

		const multiple = service.getMultiple("TEST");
		expect(multiple.ONE).toBeDefined();
		expect(multiple.TWO).toBeDefined();
		expect(multiple.THREE).toBeDefined();
		expect(isObservable(multiple.ONE)).toBeTruthy();
	});

	it("should return nested subtrees", () => {
		service.set({
			"TEST": {
				"ONE": "ONE",
				"TWO": "TWO",
				"THREE": {
					"SUB_THREE": "SUB_THREE"
				}
			}
		});

		const multiple = service.getMultiple("TEST");
		expect(multiple.ONE).toBeDefined();
		expect(multiple.TWO).toBeDefined();
		expect(multiple.THREE).toBeDefined();
		expect(multiple.THREE.SUB_THREE).toBeDefined();
		expect(isObservable(multiple.ONE)).toBeTruthy();
		expect(isObservable(multiple.THREE.SUB_THREE)).toBeTruthy();
	});

	it("should return an Overridable", done => {
		service.set({ "TEST": "foo" });

		const overridable = service.getOverridable("TEST");

		expect(overridable.value).toBe("foo");
		overridable.subject.subscribe(value => {
			expect(value).toBe("foo");
			done();
		});
	});

	it("should override a value", done => {
		service.set({ "TEST": "foo" });

		const overridable = service.getOverridable("TEST");

		expect(overridable.value).toBe("foo");

		overridable.override("bar");

		expect(overridable.value).toBe("bar");
		overridable.subject.subscribe(value => {
			expect(value).toBe("bar");
			done();
		});
	});

	it("should override with an observable", done => {
		service.set({ "TEST": "foo" });

		const overridable = service.getOverridable("TEST");
		const subject = new BehaviorSubject("bar");

		expect(overridable.value).toBe("foo");

		overridable.override(subject);

		expect(overridable.value).toBe(subject);
		overridable.subject.subscribe(value => {
			expect(value).toBe("bar");
			done();
		});
	});
});
