fetch("https://www.linkedin.com/notifications/?filter=mentions_all", {
  headers: {
    accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "accept-language": "en-US,en;q=0.9,vi;q=0.8,zh-CN;q=0.7,zh;q=0.6",
    "cache-control": "max-age=0",
    priority: "u=0, i",
    "sec-ch-prefers-color-scheme": "dark",
    "sec-ch-ua":
      '"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "same-origin",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1",
    cookie:
      'bcookie="v=2&ad3101c3-0cb2-4f4a-8d16-7f5b44428f08"; bscookie="v=1&202511131512123a09f181-d079-4923-8bc0-9cee12d71c00AQGedpmhFGb8rzhaxA7whdQ_8vops9mC"; aam_uuid=69221420810113712070015748591113145973; li_rm=AQGCUpdcriWsMQAAAZp9yTajnom4FrcxXABO1clfXZ0YbX2RMEKdsozGw4IxAGN8Fxry2mSbOsiVd_SMdwXaO7DAnyuVfXqDrD1DEa1_5HwuaM5qC2IMYOz7BWQE97p-vZxlnhRWGj_PzM89LxpNCzLtl0kgnJ2qZyLPKApNYqb9pMXlPse6tAMSUKQj-KtFAQRFA7HnabGU-0tdC8Ae9sqfmgYJKix3_rTAqbN0WA6A3Yv3UMXVbRCf7qYs-KX75ccox4hmNgiLma3-IegBSEDFk4i9w8TeIp7jSiS1bdAF3j6z9Aw4Q-a_K8O7Gp7WT7UxaH2nDvdFY5tMVcdYjw; timezone=Asia/Saigon; li_theme=light; li_theme_set=app; li_sugr=fbbb2a3b-4c1c-430c-9c73-2356eea4e054; _guid=22872d95-f9c4-4224-9a8d-873bac5fdb27; dfpfpt=346bf82687b3425cacd5307405ebea75; visit=v=1&M; g_state={"i_l":0}; liap=true; JSESSIONID="ajax:6330553989804535630"; _pxvid=2300c2c1-c0a3-11f0-8bd5-72c75883f80a; _gcl_au=1.1.346715879.1763046930.2007381304.1768025143.1768025145; li_at=AQEDATnB9GgCg4oyAAABmtoFQhQAAAGcRwUw1FYAfejDrsXWthzm2TIaEgiTQKj1tOH43sE0uQmKnHr11BKoH5FK2p4rXcZ4N8xBVgcCnI7VhD1FHkZ6N1mVRw8_0QCcwYJyf47rf09RIs40Ist0w1D7; AnalyticsSyncHistory=AQJkt-QpH8pPlwAAAZwi-L72JmiKi4uMHPpBGkX4e_aCFXiWr0NsPh-Jkzv6de_bjgcWo3BIs7DvPVIM7A9PBQ; lms_ads=AQHU5rVI9xYJrAAAAZwi-MATWRrOsSzdrgkydXph4W92oCeoRjFKICLiUKhEmTFUiNeMFxjqu_SIpjQMXsP9iMwLazUR9TpH; lms_analytics=AQHU5rVI9xYJrAAAAZwi-MATWRrOsSzdrgkydXph4W92oCeoRjFKICLiUKhEmTFUiNeMFxjqu_SIpjQMXsP9iMwLazUR9TpH; ph_phc_FsbxUWX5s2ZfqCyXmPgJFJkLbTTgUbXYtIh4IVX8KUC_posthog=%7B%22%24device_id%22%3A%226dedafe4-894c-44be-b715-1ecc10e78fd8%22%2C%22distinct_id%22%3A%226dedafe4-894c-44be-b715-1ecc10e78fd8%22%2C%22%24sesid%22%3A%5B1770113307577%2C%22019c22f8-bb42-7937-bda8-1736d465d948%22%2C1770113252160%5D%2C%22%24epp%22%3Atrue%2C%22%24initial_person_info%22%3A%7B%22r%22%3A%22%24direct%22%2C%22u%22%3A%22https%3A%2F%2Fwww.linkedin.com%2Ffeed%2F%22%7D%7D; sdui_ver=sdui-flagship:0.1.26500+SduiFlagship0; lang=v=2&lang=en-us; __cf_bm=K9OKo.7mbBGLqKbLTACKc2gt_O2WMQewFL3Gd.N0yTs-1770310942-1.0.1.1-8BPeMmEzDnX48cC2vV2cpnNte89ME32JIV01nQuBYvkFgn04HE9r4hbG_pW4tPXZnYEfd9FD59J4sziDUkx8dItfAYnZvc2r499VkOxVhuw; UserMatchHistory=AQJ11JscrfuBYAAAAZwuwUKsCuRZAHpEnVv6mbOs60VOJpyUdFmJ1mGPvMuhU9JFlIb7GgaCbtnFhUcQ4tXAQQPSW8EIHsXo-6RZFgBp41kgprwx6Tks9DSoFnmr-Z_KFoCKwBIiYBuhsBAFcvIsC-hjWxFDgZ4INzsd6XGtXxLWc_l5OqX04dKFKKWBl1oMM7IZjfLe3wr9_kB-TzOTDcSe3wLRztWCfFcvJM_xVcGoyBZuF5Se5AkROQlpmv_49Ch0J06HK2VEuj2rxNNTAYk4twUU_mmXTzcLImdUHP8WvWPSaWSkUjqHzyIozjdoGMZalkTTkIWG7JyMThSItHHK2zFASOrTOh6I5qLsrQxdAq2T8g; AMCVS_14215E3D5995C57C0A495C55%40AdobeOrg=1; AMCV_14215E3D5995C57C0A495C55%40AdobeOrg=-637568504%7CMCIDTS%7C20490%7CMCMID%7C69803822687205291640070048228618403262%7CMCAAMLH-1770915743%7C3%7CMCAAMB-1770915743%7C6G1ynYcLPuiQxYZrsz_pkqfLG9yMXBpb2zX5dvJdYQJzPXImdj0y%7CMCOPTOUT-1770318143s%7CNONE%7CvVersion%7C5.1.1%7CMCCIDH%7C1108501861; fptctx2=taBcrIH61PuCVH7eNCyH0F58uBDuZFZOunQHZt3Fugltsj3OHtKd%252bfqeP6bI1CdJEZmlW13Mh31Aji3fHnG17eJlQdjXuHkJxIXW70Q7AsKLvoY2Zk0ykC0thDkj5UHDRtEfG%252fEE6yzcKH6UfV7EMreuFdY%252fUS5oR7mbjCnf0owPfQc5HV7Y4wo9G%252f7urDrHObXSU5g6U4MORQokAX%252faBmGnMQtsRsNPezQQFqSGhhE%252fLKr78rIbCM%252bFmzcsG1hVDeFlWxH4Eln%252fBIJINOt2qwHOpBPTmUcTADDxPZrVYv%252b0iegyaYscqIVCVkR%252fSFlWZYQOQ40F2yp%252fB0HUQrHqI%252bvt2on3uKLO%252bVwN1hwHNnA%252by4F9X5XuGaMDbEK%252fKsQYQ%252f28VtX1xDv2T7MSYj8PQQ%253d%253d; lidc="b=OB28:s=O:r=O:a=O:p=O:g=4295:u=124:x=1:i=1770311055:t=1770397344:v=2:sig=AQFObbBMqT3r_125Sq2CkfGMFUGr_JgI"',
  },
  body: null,
  method: "GET",
});
