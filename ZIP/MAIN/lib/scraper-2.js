import __import0 from "axios";
const axios = __import0;

async function convert(id, type, state) {
  try {
    const data2 = { id: id, type: type, state: state };
    const headers2 = {
      'accept': 'application/json',
      'accept-language': 'en-US,en;q=0.9',
      'referer': 'https://www.savethevideo.com/',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    };

    // Fix: Use params for GET requests
    const res = await axios.get('https://api.v02.savethevideo.com/tasks/' + id, { params: data2, headers: headers2 });
    return res.data;

  } catch (error) {
    return error.message;
  }
}

async function infoconvert(id, type, state) {
  try {
    const data2 = { id: id, type: 'info', state: state };
    const headers2 = {
      'accept': 'application/json',
      'accept-language': 'en-US,en;q=0.9',
      'referer': 'https://www.savethevideo.com/',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    };

    // Fix: Use params for GET requests
    const res = await axios.get('https://api.v02.savethevideo.com/tasks/' + id, { params: data2, headers: headers2 });
    return res.data;

  } catch (error) {
    return error.message;
  }
}

export default class Dailymotion {
  constructor() {}

  async download(query, format = 'mp4') {
    try {
      const headers = {
        'accept': 'application/json',
        'accept-language': 'en-US,en;q=0.9',
        'content-type': 'application/json',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      };

      const data = { type: 'convert', url: query, format: format };
      const response = await axios.post('https://api.v02.savethevideo.com/tasks', data, { headers });
      const resData = response.data;
      let converts;

      if (resData.state !== 'pending') {
        return {
          status: true,
          creator: 'PrinceTech',
          result: resData.result,
        };
      }

      do {
        converts = await convert(resData.id, resData.type, resData.state);
      } while (converts.state !== 'completed');

      const result = {
        status: true,
        creator: 'PrinceTech',
        result: converts.result,
      };

      return result;
    } catch (error) {
      console.log({
        status: false,
        creator: 'PrinceTech',
        error: error.message,
      });
      return error.message;
    }
  }

  async info(query) {
    try {
      const headers = {
        'accept': 'application/json',
        'accept-language': 'en-US,en;q=0.9',
        'content-type': 'application/json',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      };

      const data = { type: 'info', url: query };
      const response = await axios.post('https://api.v02.savethevideo.com/tasks', data, { headers });
      const resData = response.data;
      let converts;

      if (resData.state !== 'pending') {
        return {
          status: true,
          creator: 'PrinceTech',
          result: {
            title: resData.result[0].title,
            image: resData.result[0].thumbnail,
            duration: resData.result[0].duration_string,
            uploadBy: resData.result[0].uploader,
            views: resData.result[0].view_count,
            like: resData.result[0].like_count,
            tags: resData.result[0].tags,
            type: resData.result[0]._type,
            ext: resData.result[0].ext,
          },
        };
      }

      do {
        converts = await infoconvert(resData.id, resData.type, resData.state);
      } while (converts.state !== 'completed');

      return {
        status: true,
        creator: 'PrinceTech',
        result: {
          title: converts.result[0].title,
          image: converts.result[0].thumbnail,
          duration: converts.result[0].duration_string,
          uploadBy: converts.result[0].uploader,
          views: converts.result[0].view_count,
          like: converts.result[0].like_count,
          tags: converts.result[0].tags,
          type: converts.result[0]._type,
          ext: converts.result[0].ext,
        },
      };
    } catch (error) {
      console.log({
        status: false,
        creator: 'PrinceTech',
        error: error.message,
      });
      return error.message;
    }
  }
};

