const fs = require('fs');
const path = require('path');

const locales = {
  en: {
    proTipsTitle: "PRO TIPS FOR EDITORS",
    tip1Title: "PERFORMANCE",
    tip2Title: "FORMAT",
    tip3Title: "WORKFLOW"
  },
  es: {
    proTipsTitle: "CONSEJOS PRO PARA EDITORES",
    tip1Title: "RENDIMIENTO",
    tip2Title: "FORMATO",
    tip3Title: "FLUJO DE TRABAJO"
  },
  de: {
    proTipsTitle: "PRO-TIPPS FÜR CUTTER",
    tip1Title: "LEISTUNG",
    tip2Title: "FORMAT",
    tip3Title: "WORKFLOW"
  },
  fr: {
    proTipsTitle: "CONSEILS PRO POUR MONTEURS",
    tip1Title: "PERFORMANCE",
    tip2Title: "FORMAT",
    tip3Title: "WORKFLOW"
  },
  pt: {
    proTipsTitle: "DICAS PRO PARA EDITORES",
    tip1Title: "DESEMPENHO",
    tip2Title: "FORMATO",
    tip3Title: "FLUXO DE TRABALHO"
  },
  hi: {
    proTipsTitle: "संपादकों के लिए प्रो टिप्स",
    tip1Title: "प्रदर्शन",
    tip2Title: "प्रारूप",
    tip3Title: "कार्यप्रवाह"
  },
  ja: {
    proTipsTitle: "編集者のためのプロのヒント",
    tip1Title: "パフォーマンス",
    tip2Title: "フォーマット",
    tip3Title: "ワークフロー"
  },
  ru: {
    proTipsTitle: "ПРО СОВЕТЫ ДЛЯ РЕДАКТОРОВ",
    tip1Title: "ПРОИЗВОДИТЕЛЬНОСТЬ",
    tip2Title: "ФОРМАТ",
    tip3Title: "РАБОЧИЙ ПРОЦЕСС"
  },
  zh: {
    proTipsTitle: "给编辑者的专业提示",
    tip1Title: "性能",
    tip2Title: "格式",
    tip3Title: "工作流程"
  }
};

for (const [lang, translations] of Object.entries(locales)) {
  const filePath = path.join(__dirname, 'src/locales', lang, 'clipbolt.ts');
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8');
    // Si ya tiene proTipsTitle para evitar duplicar
    if (!content.includes('proTipsTitle')) {
      const addStr = Object.entries(translations).map(([k,v]) => `  "${k}": "${v}",`).join('\n');
      content = content.replace(/  "streamer":/, addStr + '\n  "streamer":');
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`Updated ${lang}`);
    } else {
        console.log(`Skipped ${lang} because it already contains proTipsTitle`);
    }
  }
}
