import MarkdownIt from "markdown-it";
import MarkdownItIns from "markdown-it-ins";
import MarkdownItMark from "markdown-it-mark";

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
 
import {
  ADD_DEFAULT_WIDTH,
  ADD_DEFAULT_HEIGHT,
  MARK,
  STORAGE_LAYOUT,
} from "./constant";

import LAYOUT from "./theme1";

const md = new MarkdownIt();
md.use(MarkdownItIns);
md.use(MarkdownItMark);

/**
 * 全屏
 */
export const fullScreen = () => {
  var el = document.documentElement;
  var rfs =
    el.requestFullScreen ||
    el.webkitRequestFullScreen ||
    el.mozRequestFullScreen ||
    el.msRequestFullScreen;
  if (typeof rfs != "undefined" && rfs) {
    rfs.call(el);
  }
};

/**
 * 退出全屏
 */
export const exitFullScreen = () => {
  var el = document;
  var cfs =
    el.cancelFullScreen ||
    el.webkitCancelFullScreen ||
    el.mozCancelFullScreen ||
    el.exitFullScreen;
  if (typeof cfs != "undefined" && cfs) {
    cfs.call(el);
  }
};

/**
 * 从markdown格式的内容获取原始内容
 * @param {markdown格式的内容} mdContent
 */
export const getOriginContent = mdContent => {
  const [value, align] = solveAlign(mdContent);
  // 先匹配横线和竖线
  const hlineReg = /-[-]+-/;
  const vlineReg = /\+[+]+\+/;
  if (hlineReg.exec(value)) {
    return ["---", align];
  } else if (vlineReg.exec(value)) {
    return ["+++", align];
  }
  return [md.render(value).replace(/<[^>]+>/g, ""), align];
};

export const calclayout = (unsortLayout = LAYOUT) => {
  // 有缓存先获取缓存
  if (window.localStorage.getItem(STORAGE_LAYOUT)) {
    unsortLayout = window.localStorage.getItem(STORAGE_LAYOUT);
    unsortLayout = JSON.parse(unsortLayout);
  }
  // // 没有缓存则使用localStorage中模板号指定的
  // else if(window.localStorage.getItem(TEMPLATE_NUM)) {
  //   unsortLayout = THEMES[TEMPLATE_NUM];
  // }
  // 空模板
  if (unsortLayout.length === 0) {
    return [unsortLayout, 0];
  }
  const layout = unsortLayout.sort(compare("i"));;
  const len = layout.length;
  const count = parseInt(layout[len - 1].i.split(MARK)[1]) + 1;
  return [layout, count];
};

export const generateItem = (key, value = "") => {
  return {
    i: key,
    x: 0,
    y: Infinity,
    w: ADD_DEFAULT_WIDTH,
    h: ADD_DEFAULT_HEIGHT,
    value: value
  };
};

/**
 * 深拷贝
 * @param {} source
 */
export function deepClone(source) {
  if (!source && typeof source !== "object") {
    throw new Error("error arguments", "shallowClone");
  }
  const targetObj = source.constructor === Array ? [] : {};
  Object.keys(source).forEach(keys => {
    if (source[keys] && typeof source[keys] === "object") {
      targetObj[keys] = deepClone(source[keys]);
    } else {
      targetObj[keys] = source[keys];
    }
  });
  return targetObj;
}

// 有数字按照数字来排序，无数字则按照字母顺序排序
export const compare = pro => {
  return function(obj1, obj2) {
    var val1 = obj1[pro];
    var val2 = obj2[pro];
    var arr1 = val1.split(MARK);
    var arr2 = val2.split(MARK);
    return parseInt(arr1[1]) - parseInt(arr2[1]);
  };
};

export const parseMarkdown = itemValue => {
  const [value, align] = solveAlign(itemValue);

  let html = solveLine(value);
  html = html ? html : md.render(value);

  return [html, align];
};

const solveAlign = itemValue => {
  const align = {
    hStart: false,
    hCenter: false,
    hEnd: false,
    vStart: false,
    vCenter: false,
    vEnd: false
  };

  const reg = /\[[-+][SCE]\]/i;
  let value = itemValue;
  let res = reg.exec(value);
  while (res) {
    const index = res.index;
    const matchValue = res[0];
    switch (matchValue) {
      case "[-S]":
        align.hStart = true;
        break;
      case "[-s]":
        align.hStart = true;
        break;
      case "[-C]":
        align.hCenter = true;
        break;
      case "[-c]":
        align.hCenter = true;
        break;
      case "[-E]":
        align.hEnd = true;
        break;
      case "[-e]":
        align.hEnd = true;
        break;
      case "[+S]":
        align.vStart = true;
        break;
      case "[+s]":
        align.vStart = true;
        break;
      case "[+C]":
        align.vCenter = true;
        break;
      case "[+c]":
        align.vCenter = true;
        break;
      case "[+E]":
        align.vEnd = true;
        break;
      case "[+e]":
        align.vEnd = true;
        break;
      default:
    }
    value = value.slice(0, index) + value.slice(index + 4);
    res = reg.exec(value);
  }
  return [value, align];
};

const solveLine = value => {
  // 横线和竖线的正则匹配
  const hlineReg = /-[-]+-/;
  const vlineReg = /\+[+]+\+/;
  const strongHlineReg = /\*\*-[-]+-\*\*/;
  const strongVlineReg = /\*\*\+[+]+\+\*\*/;
  const colorHlineReg = /`-[-]+-`/;
  const colorVlineReg = /`\+[+]+\+`/;
  const strongColorHlineReg = /\*\*`-[-]+-`\*\*/;
  const strongColorVlineReg = /\*\*`\+[+]+\+`\*\*/;

  let html;

  if (strongColorHlineReg.exec(value)) {
    html = "<strong><code><ins><hr></ins></code></strong>";
  } else if (strongColorVlineReg.exec(value)) {
    html = "<strong><code><mark><hr></mark></code></strong>";
  } else if (strongHlineReg.exec(value)) {
    html = "<strong><ins><hr></ins></strong>";
  } else if (strongVlineReg.exec(value)) {
    html = "<strong><mark><hr></mark></strong>";
  } else if (colorHlineReg.exec(value)) {
    html = "<code><ins><hr></ins></code>";
  } else if (colorVlineReg.exec(value)) {
    html = "<code><mark><hr></mark></code>";
  } else if (hlineReg.exec(value)) {
    html = "<ins><hr></ins>";
  } else if (vlineReg.exec(value)) {
    html = "<mark><hr></mark>";
  }
  return html;
};

/**
 * 创建并下载文件
 * @param  {String} fileName 文件名
 * @param  {String} content  文件内容
 */
export const downloadFile = (fileName, content) => {
  var aTag = document.createElement('a');
  var blob = new Blob([content]);
  aTag.download = fileName;
  aTag.href = URL.createObjectURL(blob);
  aTag.click();
  URL.revokeObjectURL(blob);
}
// 导出页面为PDF格式
/***
 * elementName: 需要输出PDF的页面id
 * htmlTitle: 页面标题
 * currentTime：创建时间
 */
export const exportPDF2 = (fileName, element) => {
    html2canvas(element, {
        logging: false,
        scale: 4
    }).then(function(canvas) {
        var pdf = new jsPDF("p", "mm", "a4") // A4纸，纵向
        var ctx = canvas.getContext("2d")
        var a4w = 190;
        var a4h = 257 // A4大小，210mm x 297mm，四边各保留20mm的边距
        var imgHeight = Math.floor(a4h * canvas.width / a4w) // 按A4显示比例换算一页图像的像素高度
        var renderedHeight = 0

        while (renderedHeight < canvas.height) {
            var page = document.createElement("canvas")
            page.width = canvas.width
            page.height = Math.min(imgHeight, canvas.height - renderedHeight) // 可能内容不足一页

            // 用getImageData剪裁指定区域，并画到前面创建的canvas对象中
            page.getContext("2d").putImageData(ctx.getImageData(0, renderedHeight, canvas.width, Math.min(imgHeight, canvas.height - renderedHeight)), 0, 0)
            pdf.addImage(page.toDataURL("image/jpeg", 1.0), "JPEG", 10, 10, a4w, Math.min(a4h, a4w * page.height / page.width)) // 添加图像到页面，保留10mm边距

            renderedHeight += imgHeight
            if (renderedHeight < canvas.height) { pdf.addPage() } // 如果后面还有内容，添加一个空页
            // delete page;
        }
        pdf.save(fileName + '.pdf')
    })
}
// 创建PDF文档
export const generatePDF = (fileName, element) => {
  //获取元素
  //在html 元素中将字体写入样式
  element.style.fontFamily = "siyuan";
  //创建pdf文件
  const doc = new jsPDF('p', 'pt', 'a4');
  // 设置边距
  const margin = {
      top: 60, right: 60, bottom: 60, left: 60
  };
  // 计算实际页面宽度和高度
  const pdfWidth = doc.getPageWidth();
  const pageWidth = pdfWidth - margin.left - margin.right;
  const pageHeight = doc.getPageHeight() - margin.top - margin.bottom;
  doc.html(element, {
          callback(pdf) {
              // 添加页脚
              console.log(pdf, 'susssssssss')
              // const file = pdf.output(type);
          },
          autoPaging: 'text',//设置跨页自动换行
          windowWidth: pdfWidth,
          width: pageWidth,
          height: pageHeight,
          margin: [margin.top, margin.right, margin.bottom, margin.left]
   });
}
