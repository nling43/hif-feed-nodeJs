const express = require("express");
const cheerio = require("cheerio");
const axios = require("axios");
const moment = require("moment");

const app = express();
app.use(express.json());
app.use(require("body-parser").json());
const PORT = process.env.PORT || 3000;

async function fs() {
	const url = "https://fotbollskane.se/tag/helsingborgs-if/";
	try {
		const promise = await axios(url);
		const promiseData = promise.data;
		const $ = cheerio.load(promiseData);
		const news = [];
		$("article.tag-helsingborgs-if").each(function () {
			const h1Tag = $(this).find("h1.entry-title");
			const date = new Date(
				$(this).find("span.post-date").find("a").text().trim().replace(",", "")
			);
			news.push({
				title: $(h1Tag).find("a").text().trim(),
				url: $(h1Tag).find("a").attr("href"),
				img: $(this).find("img.wp-post-image").attr("src"),
				txt: $(this).find("p").text().trim(),
				src: "Fotbollskåne",
				date: moment(date).format("yyyy/MM/D"),
			});
		});

		return news;
	} catch (e) {
		console.log("fs error", e);
	}
}
async function hd() {
	const url = "https://hd.se/hif";
	try {
		const promise = await axios(url);
		const promiseData = promise.data;
		const $ = cheerio.load(promiseData);
		const news = [];
		$("article.teaser").each(function () {
			const url = $(this).find("a.block-link-overlay").attr("href").trim();
			news.push({
				title: $(this).find("span.prose-title").text().trim(),
				url: "https://www.hd.se" + url,
				img: $(this).find("img.teaser__img").attr("data-src").trim(),
				txt: $(this).find("div.teaser__standfirst").text().trim(),
				src: "Helsingborgs Dagblad",
				date: moment(url.slice(1, 11)).format("yyyy/MM/D"),
			});
		});

		return news;
	} catch (e) {
		console.log("hd error", e);
	}
}

async function fd() {
	const url = "https://fotbolldirekt.se/lag/helsingborgs-if/26";
	try {
		const promise = await axios(url);
		const promiseData = promise.data;
		const $ = cheerio.load(promiseData);
		const news = [];
		$("div.c-vertical-article").each(function () {
			const url = $(this).find("a.c-vertical-article__title").attr("href");
			const img = $(this).find("a.c-vertical-article__image").attr("style");
			news.push({
				title: $(this)
					.find("a.c-vertical-article__title")
					.text()
					.trim(this.startIndex),
				url: url,
				img: img.slice(23, img.length - 3),
				txt: $(this)
					.find("a.c-vertical-article__excerpt")
					.text()
					.trim(this.startIndex),
				src: "Fotbolldirekt",
				date: moment(new Date(url.slice(25, 35))).format("yyyy/MM/D"),
			});
		});

		return news;
	} catch (e) {
		console.log("fd error", e);
	}
}

async function hif() {
	const url = "https://www.hif.se/nyheter/";
	try {
		const promise = await axios(url);
		const promiseData = promise.data;
		const $ = cheerio.load(promiseData);
		const news = [];
		$("article.blog-entry").each(function () {
			const txt = $(this)
				.find("div.blog-entry-excerpt")
				.find("p")
				.text()
				.split(".");
			news.push({
				title: $(this).find("h2.blog-entry-title").find("a").text(),
				url: $(this).find("h2.blog-entry-title").find("a").attr("href"),
				img: $(this).find("img.blog-entry-media-img").attr("src"),
				txt: txt[0],
				src: "HIF",
				date: moment($(this).find("time.updated").attr("datetime")).format(
					"yyyy/MM/D"
				),
			});
		});
		return news;
	} catch (e) {
		console.log("HIF.se error", e);
	}
}
app.get("/", async (req, res) => {
	res.send("ok");
});

app.get("/news", async (req, res) => {
	try {
		const fsArray = await fs();
		const hdArray = await hd();
		const fdArray = await fd();
		const hifArray = await hif();

		// get date for forbollskåne

		// combine and sort on date
		const news = fsArray.concat(hdArray, fdArray, hifArray);
		news.sort(function (a, b) {
			const aDate = a.date.split("/");
			const bDate = b.date.split("/");

			let result = bDate[0] - aDate[0];
			if (result !== 0) return result;
			result = bDate[1] - aDate[1];
			if (result !== 0) return result;
			return bDate[2] - aDate[2];
		});
		res.json(news.splice(0, 20));
	} catch (error) {
		console.log("error @ news endpoint", error);
		res.send(error);
	}
});

app.listen(PORT, () => console.log("Running @ " + PORT));
