import { Request, Response, json } from "express";
import Server, { Controller, Get, Post } from "./lib/index";

@Controller("/hello")
class HelloWorldController {
	@Get("/")
	getGreeting(_req: Request, res: Response) {
		res.status(200).json({
			message: "Hello World!"
		});
	}

	@Get("/:name")
	getGreetingWithName(req: Request, res: Response) {
		let { name } = req.params;

		if (name === "") {
			name = "Anonymous";
		}

		res.status(200).json({
			message: `Hello ${name}!`
		});
	}

	@Post("/")
	postGreeting(req: Request, res: Response) {
		res.status(200).json(req.body);
	}
}

const port = 3000;

const server = new Server({
	port,
	middlewares: [json()],
	controllers: [HelloWorldController]
});

server.listen(() => {
	console.log(`Server listening on port ${port}`);
});
