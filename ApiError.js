export default class ApiError {
    constructor(fetchResponse) {
       this.ok = false;
       this.response = fetchResponse;
    }
  }
  