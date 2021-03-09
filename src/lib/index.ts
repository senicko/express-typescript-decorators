import express, { Express, RequestHandler, Router } from "express";

enum HttpMethods {
	GET = "get",
	POST = "post",
	PUT = "put",
	DELETE = "delete"
}

export interface Route {
	method: HttpMethods;
	path: string;
	handler: RequestHandler;
	middlewares?: RequestHandler[];
}

export interface ControllerMeta {
	path: string;
	routes: Route[];
	middlewares: RequestHandler[];
}

export interface MiddlewareOptions {
	middlewares?: RequestHandler[];
}

const getMeta = (target: any): ControllerMeta => {
	// If class does not have meta create it
	if (!target.meta) {
		target.meta = {
			path: "",
			routes: [],
			middlewares: []
		};
	}

	return target.meta;
};

// Controller decorator
export const Controller = <T extends Function>(path: string, options?: MiddlewareOptions) => {
	return (constructor: T) => {
		const meta: ControllerMeta = getMeta(constructor.prototype);
		meta.path = path;
		meta.middlewares = options?.middlewares ?? [];
	};
};

// Router factory
const routeFactory = (method: HttpMethods, path: string, { middlewares }: MiddlewareOptions) => {
	return (
		target: any,
		_key: string | symbol,
		descriptor: PropertyDescriptor
	): PropertyDescriptor => {
		// Get meta
		const meta: ControllerMeta = getMeta(target);

		// Assign options controller class meta
		meta.routes.push({
			method,
			path,
			middlewares: middlewares ?? [],
			handler: descriptor.value as RequestHandler
		});

		return descriptor;
	};
};

// Get method decorator
export const Get = (path: string, options?: MiddlewareOptions) => {
	return routeFactory(HttpMethods.GET, path, options ?? {});
};

// Post method decorator
export const Post = (path: string, options?: MiddlewareOptions) => {
	return routeFactory(HttpMethods.POST, path, options ?? {});
};

// Put method decorator
export const Put = (path: string, options?: MiddlewareOptions) => {
	return routeFactory(HttpMethods.PUT, path, options ?? {});
};

// Delete method decorator
export const Delete = (path: string, options?: MiddlewareOptions) => {
	return routeFactory(HttpMethods.DELETE, path, options ?? {});
};

export default class Server {
	app: Express;
	port: number;

	constructor({
		port,
		controllers,
		middlewares
	}: {
		port: number;
		controllers: (new () => any)[];
		middlewares?: RequestHandler[];
	}) {
		// Create app
		this.app = express();
		this.port = port;

		// Assign app middlewares and app routes
		this.assignMiddlewares(middlewares ?? []);
		this.assignControllers(controllers);
	}

	private assignMiddlewares(middlewares: RequestHandler[]) {
		// Apply middlewares to app
		middlewares.forEach((middleware) => {
			this.app.use(middleware);
		});
	}

	private assignControllers(controllers: (new () => any)[]) {
		controllers.forEach((controller) => {
			// Get meta and create route
			const meta = getMeta(new controller());
			const router = Router();

			// Apply route handlers
			meta.routes.forEach((route) => {
				router[route.method](route.path, route.middlewares ?? [], route.handler);
			});

			// Apply route to app
			this.app.use(meta.path, meta.middlewares ?? [], router);
		});
	}

	listen(cb: () => void) {
		this.app.listen(this.port, cb);
	}
}
