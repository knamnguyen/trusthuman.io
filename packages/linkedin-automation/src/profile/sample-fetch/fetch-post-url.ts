fetch(
  "https://www.linkedin.com/feed/update/urn:li:activity:7415738731510468608/",
  {
    headers: {
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-language": "en-US,en;q=0.9,vi;q=0.8,zh-CN;q=0.7,zh;q=0.6",
      "cache-control": "max-age=0",
      priority: "u=0, i",
      "sec-ch-prefers-color-scheme": "dark",
      "sec-ch-ua":
        '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "same-origin",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
      cookie:
        'bcookie="v=2&ad3101c3-0cb2-4f4a-8d16-7f5b44428f08"; bscookie="v=1&202511131512123a09f181-d079-4923-8bc0-9cee12d71c00AQGedpmhFGb8rzhaxA7whdQ_8vops9mC"; aam_uuid=69221420810113712070015748591113145973; li_rm=AQGCUpdcriWsMQAAAZp9yTajnom4FrcxXABO1clfXZ0YbX2RMEKdsozGw4IxAGN8Fxry2mSbOsiVd_SMdwXaO7DAnyuVfXqDrD1DEa1_5HwuaM5qC2IMYOz7BWQE97p-vZxlnhRWGj_PzM89LxpNCzLtl0kgnJ2qZyLPKApNYqb9pMXlPse6tAMSUKQj-KtFAQRFA7HnabGU-0tdC8Ae9sqfmgYJKix3_rTAqbN0WA6A3Yv3UMXVbRCf7qYs-KX75ccox4hmNgiLma3-IegBSEDFk4i9w8TeIp7jSiS1bdAF3j6z9Aw4Q-a_K8O7Gp7WT7UxaH2nDvdFY5tMVcdYjw; timezone=Asia/Saigon; li_theme=light; li_theme_set=app; li_sugr=fbbb2a3b-4c1c-430c-9c73-2356eea4e054; _guid=22872d95-f9c4-4224-9a8d-873bac5fdb27; dfpfpt=346bf82687b3425cacd5307405ebea75; visit=v=1&M; g_state={"i_l":0}; liap=true; JSESSIONID="ajax:6330553989804535630"; _pxvid=2300c2c1-c0a3-11f0-8bd5-72c75883f80a; lang=v=2&lang=en-us; AMCVS_14215E3D5995C57C0A495C55%40AdobeOrg=1; _px3=e5e07f23c897a01be2618213fd02d61bcbdc73cf85bb86ea95b4ff616a6df18c:4v53svpG1DrgBMx7vO2yus4t1UEbtx3G2J1mqNpMTWmyUpCP2Qko5TKbqbnDJ9UCNN3MMkEnkGQyTg0bWe01gA==:1000:ARZES92Duryd5VAzCbvsDPKOxbddlio94vx9H8Vhc6VZjHj+lV52af8Si4khkQ052+K+CSksNNQF3D31rhG5DSjDgi3hn9I2+VketW0hxbkVLQnXJHzAiV5zrHc5212sm6ORsz6Q0WDSwL4xR6wZ0d4PvbWAMOnCovFffifkQMkrdAFUvWkhsj//Lad20bGpz2tmtmAD33y3KPx0eO19V/ztr8GVffg2aRCW6A3TW9W8J9o2aNvIpIsRIvXC02D4MSvIbuY22tHkb4OlepygO0Wjcf/u/ZBysvVpXJa7wPtbhPLb9Rg8OJVkD81K1y/73AJWwOKInQE+BDsC/fshU6twua3D0nRelOztFaDdCkc=; li_at=AQEDATnB9GgCg4oyAAABmtoFQhQAAAGbsx_l4VYAHwQKUyTDhb96dMi5jhw7Ttq8DMhHKKPoXp7zkLdIX3RarEoazTprhibIDzpSZHP48ZP4VSR5qbLkz7QKqC3bZE_-6Bo-23W7SnrvsSOG7xU9pQZ5; sdui_ver=sdui-flagship:0.1.23947+SduiFlagship0; _gcl_au=1.1.346715879.1763046930.2007381304.1768025143.1768025145; AnalyticsSyncHistory=AQJ6AZTLSceq4AAAAZusAfOC-R8eRXcPelEdXuFBz9HXXoW27MC0oJhywNfGYBaanZXxmnoBLqSaOCJ6wePWww; lms_ads=AQF8x-La09QJ-gAAAZusAfTosLw7JBftE3XhwoHEJH3jOwyDyN2iQzy0rBnrsQCq0ayTqCcXpruUaKobjLJj_4UVI0aTpn1l; lms_analytics=AQF8x-La09QJ-gAAAZusAfTosLw7JBftE3XhwoHEJH3jOwyDyN2iQzy0rBnrsQCq0ayTqCcXpruUaKobjLJj_4UVI0aTpn1l; fptctx2=taBcrIH61PuCVH7eNCyH0F58uBDuZFZOunQHZt3Fugltsj3OHtKd%252bfqeP6bI1CdJEZmlW13Mh31Aji3fHnG17eJlQdjXuHkJxIXW70Q7AsKLvoY2Zk0ykC0thDkj5UHDRtEfG%252fEE6yzcKH6UfV7EMhxgHRe44bbkwIliajOs6YvZtAB3hlrMiGd3PmBOmFoeO7gUDPJfzMc16m6OXUFdmKdX5y0iEH09H%252fP9GbP3SAV3a71VgDJ9cwDAo3yX8uOAL61WYTTW%252fB%252fPlDwwZY22xcTwasNfXSMBTy%252bDHCATYBH1FuUTgKWpqQAbq3PZcrD%252fukbZL9i5js4PeSije0r51tRIPiJGSIbFawACo0UIzVY%253d; AMCV_14215E3D5995C57C0A495C55%40AdobeOrg=-637568504%7CMCIDTS%7C20465%7CMCMID%7C69803822687205291640070048228618403262%7CMCAAMLH-1768810963%7C3%7CMCAAMB-1768810963%7C6G1ynYcLPuiQxYZrsz_pkqfLG9yMXBpb2zX5dvJdYQJzPXImdj0y%7CMCOPTOUT-1768213363s%7CNONE%7CvVersion%7C5.1.1%7CMCCIDH%7C1108501861; UserMatchHistory=AQKVf3m0GgUUvwAAAZuxWZlGWmtM-4typ27bZeZDw60Cz0s8Qd1O6kk6WMKfMO7pM8doGIW5j1JvcHx-8ZNuqdaB6uJeitJQ_qWJlxcImEA64CUW7WUZaIS_MQ1rIZNDkwBeaDInsWihQxI9EtzVKd9A3D1i0H7Kogp8EyYQ2Xm2UEj4yi3677pVc35qOyZJNv_dPi4Ljs1DjsVLNvNkZmh3UrXXzPpnT_s85rlMJ9_IEb6BUhj0VHC5ifU98QtUFMTszbRNEhLFyT8z8TwM1pdVjge-joA7W81BHM_I7wJTH1DIAcanK9AgP7NkziwYOHDqnJKsQD0ARVR663NAjmY2ZwvcBJNh_WaPKwrq7f5oYP63Lw; __cf_bm=JoO4dpw4v6Yt07OXubdtyrfku8h6vcr4qaSdhgQYA5Y-1768207924-1.0.1.1-1v9NlZva67Qq2NzcLWf_6LE5NyAApxiV3kilfMwMniplkx9ZucMM22V9gutivIj4RhKB3OKfQcW4oeHnYYjIC2oG24wsFYP_RGFMn.RxxMo; lidc="b=OB28:s=O:r=O:a=O:p=O:g=4287:u=107:x=1:i=1768208124:t=1768245888:v=2:sig=AQH2d-PNCuT-VU6QA3983tNY-Bfk5wL6"',
    },
    body: null,
    method: "GET",
  },
);
