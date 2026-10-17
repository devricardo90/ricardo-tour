import sharp from "sharp";
import fs from "node:fs";
const [dir, out] = process.argv.slice(2);
const files = ["IMG_1243","IMG_1247","IMG_1252","IMG_1253","img-favela-deck"];
const tiles = [];
for (const f of files) {
  const img = sharp(`${dir}/${f}.png`);
  const g = await img.clone().resize(1200).greyscale().convolve({width:3,height:3,kernel:[0,1,0,1,-4,1,0,1,0]}).stats();
  const s = await img.clone().resize(1200).stats();
  console.log(f, "laplacianStdev", g.channels[0].stdev.toFixed(1), "meanRGB", s.channels.slice(0,3).map(c=>c.mean.toFixed(0)).join("/"));
  tiles.push(await img.resize(360,480,{fit:"inside"}).jpeg().toBuffer());
}
const frames = fs.readdirSync(`${dir}/frames`).sort();
const comp = tiles.map((b,i)=>({input:b,left:i*370,top:0}));
const ft=[]; for (const [i,f] of frames.entries()) ft.push({input: await sharp(`${dir}/frames/${f}`).resize(160,284,{fit:"inside"}).toBuffer(), left: i*170, top: 500});
await sharp({create:{width:Math.max(1850,frames.length*170),height:800,channels:3,background:"#222"}}).composite([...comp,...ft]).jpeg({quality:80}).toFile(out);
