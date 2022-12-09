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
			news.push({
				title: $(h1Tag).find("a").text().trim(),
				url: $(h1Tag).find("a").attr("href"),
				img: $(this).find("img.wp-post-image").attr("src"),
				txt: $(this).find("p").text().trim(),
				src: "Fotbollskåne",
				date: new Date($(this).find("span.post-date").find("a").text().trim()),
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
				date: new Date(url.slice(1, 11)),
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
				date: new Date(url.slice(25, 35)),
			});
		});
		return news;
	} catch (e) {
		console.log("fd error", e);
	}
}

async function fk() {
	const url =
		"https://www.fotbollskanalen.se/allsvenskan/helsingborgs-if/?tab=nyheter";
	try {
		const promise = await axios(url);
		const promiseData = promise.data;
		const $ = cheerio.load(promiseData);
		const news = [];
		$("ul.news-list")
			.find("li")
			.each(function () {
				let date = moment();
				const date2 = $(this).find("div.news-list__item-date").text().trim();
				if (date2.charAt(1) === "d")
					date = date.subtract(date2.charAt(0), "days");
				else if (date2.charAt(1) == "v")
					date = date.subtract(date2.charAt(0), "weeks");
				else date.subtract(date2.charAt(0), "hours");
				news.push({
					title: $(this).find("span.news-list__item-text-headline").text(),
					url:
						"https://www.fotbollskanalen.se" + $(this).find("a").attr("href"),
					img: $(this).find("img").attr("data-original"),
					txt: $(this).find("span.news-list__item-text-headline").text(),
					src: "Fotbollskanalen",
					date: new Date(date),
				});
			});

		return news.slice(0, news.length - 1);
	} catch (e) {
		console.log("Fk error", e);
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
		const fkArray = await fk();

		// get date for forbollskåne

		// combine and sort on date
		const news = fsArray.concat(hdArray, fdArray, fkArray);
		news.sort(function (a, b) {
			let result = b.date.getFullYear() - a.date.getFullYear();
			if (result !== 0) return result;
			result = b.date.getMonth() - a.date.getMonth();
			if (result !== 0) return result;
			return b.date.getDate() - a.date.getDate();
		});
		res.json(news.splice(0, 20));
	} catch (error) {
		console.log("error @ news endpoint", error);
		res.send(error);
	}
});

app.listen(PORT, () => console.log("Running @ " + PORT));
