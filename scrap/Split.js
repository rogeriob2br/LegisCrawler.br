const LegislationCleaner = require('./LegislationCleaner');
const debug = require('debug')('split');

class Split {
/**
 * Breakes the article into it's number and it's text
 * @param  {String} type    The type of the legislation that will be splited
 * @param  {String} article The article full content
 * @return {Object}         Object with number and text
 * @example
 * {
 *   number: '1º',
 *   text: 'Os menores de 18 anos são penalmente inimputáveis, ficando sujeitos às normas
 *          estabelecidas na legislação especial.'
 * }
 */
  static articleText(type, article) {
    const articleNumberDefRegEx = /\s?(Art.)\s[0-9.?]+([o|º|o.])?\s?(-|\.)?(\s|[A-Z]+\.\s)?/;

  // Get only the article numeric part
    const splitedArticle = articleNumberDefRegEx.exec(article);
    const articleSpliter = splitedArticle[0];

    const number = LegislationCleaner.cleanArticleNumber(articleSpliter);
    let text = article.split(articleSpliter)[1];

  // There are some semantic errors that don't have any pattern, so we need to fix them manually
    text = LegislationCleaner.cleanKnownSemanticErrors(type, number, text);
    return {
      number,
      text,
    };
  }

  /**
   * Split the article text into text and the paragraphs
  * @param  {String} type    The type of the legislation that will be splited
  * @param  {String} text    The article text
  * @return {Object}         Object with text (without the paragraphs) and an array of objects with
  *                          numbers and paragraphs
  * @example
  * {
  *   text: 'O resultado, de que depende a existência do crime, somente é imputável a quem lhe
  *          deu causa.',
  *   paragraphs: [
  *     {
  *       number: '§ 1º',
  *       text: 'A superveniência de causa relativamente independente exclui a imputação quando, por
  *              si só, produziu o resultado; os fatos anteriores, entretanto, imputam-se a quem os
  *              praticou.'
  *     },
  *     {
  *       number: '§ 2º',
  *       text: 'A omissão é penalmente relevante quando o omitente devia e podia agir para evitar o
  *              resultado. O dever de agir incumbe a quem: a) tenha por lei obrigação de cuidado,
  *              proteção ou vigilância; b) de outra forma, assumiu a responsabilidade de impedir o
  *              resultado; c) com seu comportamento anterior, criou o risco da ocorrência do
  *              resultado. '
  *     }
  *   ]
  * }
  */
  static articleParagraphs(type, articleNumber, text) {
    const numReEx = /(\.|:)((\s?§\s\d+(º|o|°)?\.?(\s?-)?[A-z]?\s?)|(\s?Parágrafo\súnico\s?-\s?))/gm;

    let workText = text;
    const testMatches = workText.match(numReEx);
    if (testMatches === null) {
      return null;
    }

    const response = {
      text: '',
      paragraphs: [],
    };

    // debug((`Type: ${type}`.blue));
    // debug(`Matches: ${testMatches} | Count: ${testMatches.length}`.green);
    for (let i = 0; i < testMatches.length; i += 1) {
      // Get only the paragraph numeric part
      workText.match(numReEx);
      const splitedText = numReEx.exec(workText);
      const textSpliter = splitedText[0];
      const cleanPart = `${workText.split(textSpliter)[0]}.`;
      const dirtyPart = workText.split(textSpliter)[1];

      if (dirtyPart) {
          // In the first iteration, the splited part is the article text
        workText = dirtyPart;
        const number = LegislationCleaner.cleanParagraphNumber(textSpliter);
        if (i === 0) {
          // debug(`Art. ${articleNumber}: `.yellow + cleanPart);
          response.text = LegislationCleaner.trim(cleanPart);
          response.number = articleNumber;
          response.paragraphs[i] = {
            number,
            paragraph: LegislationCleaner.trim(dirtyPart),
          };
        } else {
          response.paragraphs[i - 1].paragraph = LegislationCleaner.trim(cleanPart);
          response.paragraphs[i] = {
            number,
          };
          if (i < testMatches.length) {
            response.paragraphs[i].paragraph = LegislationCleaner.trim(dirtyPart);
          }
        }
      }
    }
    debug(response);
    return response;
  }
}

module.exports = Split;
