var pix = ['simonbelmont.png','tails.png','knives.png','scott.png','yotsu.png'];
var current = 0;
function drawSource(pic) {
   var canvas = Canvas.source;
   var ctx = canvas.getContext('2d'); 
   var img = new Image();
   img.src = pic;
   img.onload = function() {
      ctx.mozImageSmoothingEnabled = false;
      ctx.clearRect(0,0,canvas.width,canvas.height);
      if ($('#scaleCheck').get(0).checked) {
         var scaleF = img.width > img.height ?
            canvas.width / img.width :
            canvas.height / img.height;
         ctx.drawImage(img,0,0,img.width*scaleF,img.height*scaleF);
      } else {
         ctx.drawImage(img,0,0);
      }
      var bits = analyze(ctx, img);
      results(bits.distinct, bits.vals, bits.colors);
   }
}
function analyze(ctx, img) {
   var canvas = ctx.getImageData(0,0, img.width,img.height);
   var data = canvas.data;
   //Wes.iterateCanvas(canvas, function(ary) { console.log(ary) });
   var colors = {}, distinct = 0, vals = [];
   colors[data[0]] = {};
   colors[data[0]][data[1]] = {};
   colors[data[0]][data[1]][data[2]] = {};
   colors[data[0]][data[1]][data[2]][data[3]] = 'bg';
   Wes.iterateCanvas(canvas, function(pixel, bigary, i) {
      var r = pixel[0],
         g = pixel[1],
         b = pixel[2],
         a = pixel[3];
      if (colors[r] == null) { colors[r] = {}; }
      if (colors[r][g] == null) { colors[r][g] = {}; }
      if (colors[r][g][b] == null) { colors[r][g][b] = {}; }
      if (colors[r][g][b][a] == null) { 
         // first time we've seen it
         distinct++;
         vals.push([r,g,b,a]);
         colors[r][g][b][a] = 0;
      }
      if (colors[r][g][b][a] == 'bg') { 
         bigary[i] = bigary[i+1] = bigary[i+2] = bigary[i+3] = 0;
      } else {
         colors[r][g][b][a]++;
      }
   });
   ctx.putImageData(canvas, 0,0);
   //delete colors[data[0]][data[1]][data[2]][data[3]];
   //console.log(colors, distinct, vals);
   vals.sort(hueSort);
   return { colors: colors, distinct: distinct, vals: vals };
}

function hueSort (a,b) {
   var hsvA = Color.rgbToHsv(a[0], a[1], a[2]), 
       hsvB = Color.rgbToHsv(b[0], b[1], b[2]);

   if (hsvA[0] > hsvB[0]) {
      return 1;
   } else if (hsvA[0] < hsvB[0]) {
      return -1;
   } else {
      return 0;
   }
}
function hsvSort (a,b) {
   var hsvA = Color.rgbToHsv(a[0], a[1], a[2]), 
       hsvB = Color.rgbToHsv(b[0], b[1], b[2]);

   if (hsvA[0] > hsvB[0]) {
      return 1;
   } else if (hsvA[1] > hsvB[1]) {
      return 1;
   } else if (hsvA[2] > hsvB[2]) {
      return 1;
   } 
   if(hsvA[0] == hsvB[0] && 
      hsvA[1] == hsvB[1] && 
      hsvA[2] == hsvB[2])
      return 0;
   return -1;
}
function sumColorSort (a,b) {
   var A = a[0] + a[1] + a[2] + a[3];
   var B = b[0] + b[1] + b[2] + b[3];
   if (A > B ) return 1
   if (A < B ) return -1;
   return 0;
}
function naiveColorSort (a,b) {
   if(a[0] == b[0] && a[1] == b[1] && a[2] == b[2] && a[3] == b[3])
      return 0;
   if (a[0] > b[0]) {
      return 1;
   } else if (a[1] > b[1]) {
      return 1;
   } else if (a[2] > b[2]) {
      return 1;
   } else if (a[3] > b[3]) {
      return -1;
   }
}
function results(distinct, vals, colors) {
   var ctx = Canvas.result.getContext('2d');
   var w = ctx.canvas.width, h = ctx.canvas.height;
   // clean up
   ctx.clearRect(0,0,w,h);
   document.getElementById('result').innerHTML='';

   var divs = Math.ceil( Math.sqrt(distinct) );
   var x = 0;
   for (var i=0;i<divs;i++) {
      for (var j=0;j<divs;j++) {
         var c = vals[x++] || [0,0,0,0];
         //console.log(i,j,c);
         ctx.fillStyle = 'rgba('+c[0]+','+c[1]+','+c[2]+','+c[3]+')';
         ctx.fillRect(i*w/divs, j*h/divs, w/divs, h/divs);
      }
   }
   addResult('Colors: '+distinct);
   var totes = 0;
   for (r in colors) {
      for (g in colors[r]) {
         for (b in colors[r][g]) {
            for (a in colors[r][g][b]) {
               if (colors[r][g][b][a] == 'bg') continue;
               totes += colors[r][g][b][a];
               //addResult('Bead color '
            }
         }
      }
   }
   addResult('pixels: '+totes);
}
function addResult (text) {
   var s = document.createElement('span');
   s.innerHTML = text;
   document.getElementById('result').appendChild(s);
}
function doIt() {
   var show = current++ % pix.length;
   drawSource(pix[show]);
}
function setBackgroundColor(e) {
   var canv = Canvas.source;
   var loc = { x: e.clientX-canv.offsetLeft, y: e.clientY-canv.offsetTop };
   var ctx = canv.getContext('2d');
   var imgdata = ctx.getImageData(0,0,canv.width,canv.height);
   var offset = ( loc.y * imgdata.width + loc.x ) * 4;
   var pixel = imgdata.data.slice(offset, offset+4);
   Canvas.bgColor = pixel;
   //results(1,[pixel],[]); // even ghetto reuse is good reuse, right?
   doIt();
};
$(document).ready(function() { 
   window.Canvas = {
      source: $('#source-canvas').get(0),
      result: $('#result-canvas').get(0)
   };
   $('#source-canvas').bind('mousedown', setBackgroundColor);
   $('#nextButton').bind('mousedown', doIt);
   doIt();
});
