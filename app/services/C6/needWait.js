import { getElementClass, sleep } from "../../../utils.js";

export async function needWait(page) {
  try {
    let wait = true

    while(wait) {
      await sleep(500);
      const classes = await getElementClass(page, '//*[@id="divLoading"]');

      console.log(classes);
      if(classes.includes('hidden')) {
        wait = false
      }
      console.log(wait);
    }

    return true
  }catch (error) {
    return  false
  }
}