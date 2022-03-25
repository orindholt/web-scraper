const { URL } = require("url");
const Apify = require("apify");
const {
  utils: { enqueueLinks },
} = Apify;

Apify.main(async () => {
  const sources = ["https://thedrinkblog.com/recipes/"];
  const maxCrawls = 100;

  const requestList = await Apify.openRequestList("recipes", sources);
  const requestQueue = await Apify.openRequestQueue();

  const data = new Array();

  const crawler = new Apify.CheerioCrawler({
    maxRequestsPerCrawl: maxCrawls,
    requestList,
    requestQueue,
    handlePageFunction: async ({ request, $ }) => {
      console.dir(`Scraping: ${request.url}`);

      /* Scraping Logic */
      if (request.userData.detailPage) {
        const header = $(".ERSName").text();
        const details = new Array();
        $(".ERSDetails .ERSHead").each((i, el) => {
          details.push({
            type: $(el)
              .clone()
              .children()
              .remove()
              .end()
              .text()
              .trim()
              .replace(":", ""),
            prop: $(el).find("time, span").text(),
          });
        });
        const ingredients = new Array();
        $(".ERSIngredients .ingredient").each((i, el) => {
          ingredients.push(
            $(el)
              .text()
              .replace(/\u00A0/, " ")
          );
        });
        const instructions = new Array();
        $(".ERSInstructions .instruction").each((i, el) => {
          instructions.push(
            $(el)
              .text()
              .replace(/\u00A0/, " ")
          );
        });
        data.push({
          name: header,
          details: details,
          ingredients: ingredients,
          instructions: instructions,
        });
        await Apify.setValue("OUTPUT", { data: data });
      } else console.log("No content...");
      const options = {
        $,
        requestQueue,
        selector: "div.thumbnail > a",
        baseUrl: request.loadedUrl,
        transformRequestFunction: (req) => {
          req.userData.detailPage = true;
          return req;
        },
      };
      await enqueueLinks(options);
    },
  });
  await crawler.run();
});
