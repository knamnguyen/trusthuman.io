//first one
fetch("https://www.linkedin.com/voyager/api/graphql?includeWebMetadata=true&variables=(count:20,start:0,profileUrn:urn%3Ali%3Afsd_profile%3AACoAAEypQscBTtvC5qXgoGALI9WUmGJJ_jzaw24)&queryId=voyagerFeedDashProfileUpdates.8f05a4e5ad12d9cb2b56eaa22afbcab9", {
    "headers": {
      "accept": "application/vnd.linkedin.normalized+json+2.1",
      "accept-language": "en-US,en;q=0.9,vi;q=0.8,zh-CN;q=0.7,zh;q=0.6",
      "csrf-token": "ajax:6330553989804535630",
      "priority": "u=1, i",
      "sec-ch-prefers-color-scheme": "dark",
      "sec-ch-ua": "\"Google Chrome\";v=\"143\", \"Chromium\";v=\"143\", \"Not A(Brand\";v=\"24\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"macOS\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-li-lang": "en_US",
      "x-li-page-instance": "urn:li:page:d_flagship3_profile_view_base_recent_activity_content_view;Dz/HBy3oShyMSLUftR8j/A==",
      "x-li-track": "{\"clientVersion\":\"1.13.41695\",\"mpVersion\":\"1.13.41695\",\"osName\":\"web\",\"timezoneOffset\":7,\"timezone\":\"Asia/Saigon\",\"deviceFormFactor\":\"DESKTOP\",\"mpName\":\"voyager-web\",\"displayDensity\":2,\"displayWidth\":2940,\"displayHeight\":1912}",
      "x-restli-protocol-version": "2.0.0",
      "cookie": "bcookie=\"v=2&ad3101c3-0cb2-4f4a-8d16-7f5b44428f08\"; bscookie=\"v=1&202511131512123a09f181-d079-4923-8bc0-9cee12d71c00AQGedpmhFGb8rzhaxA7whdQ_8vops9mC\"; aam_uuid=69221420810113712070015748591113145973; li_rm=AQGCUpdcriWsMQAAAZp9yTajnom4FrcxXABO1clfXZ0YbX2RMEKdsozGw4IxAGN8Fxry2mSbOsiVd_SMdwXaO7DAnyuVfXqDrD1DEa1_5HwuaM5qC2IMYOz7BWQE97p-vZxlnhRWGj_PzM89LxpNCzLtl0kgnJ2qZyLPKApNYqb9pMXlPse6tAMSUKQj-KtFAQRFA7HnabGU-0tdC8Ae9sqfmgYJKix3_rTAqbN0WA6A3Yv3UMXVbRCf7qYs-KX75ccox4hmNgiLma3-IegBSEDFk4i9w8TeIp7jSiS1bdAF3j6z9Aw4Q-a_K8O7Gp7WT7UxaH2nDvdFY5tMVcdYjw; timezone=Asia/Saigon; li_theme=light; li_theme_set=app; li_sugr=fbbb2a3b-4c1c-430c-9c73-2356eea4e054; _guid=22872d95-f9c4-4224-9a8d-873bac5fdb27; dfpfpt=346bf82687b3425cacd5307405ebea75; visit=v=1&M; sdui_ver=sdui-flagship:0.1.20962+SduiFlagship0; g_state={\"i_l\":0}; liap=true; JSESSIONID=\"ajax:6330553989804535630\"; _pxvid=2300c2c1-c0a3-11f0-8bd5-72c75883f80a; _gcl_au=1.1.346715879.1763046930.1427355837.1765270963.1765270967; lang=v=2&lang=en-us; AMCVS_14215E3D5995C57C0A495C55%40AdobeOrg=1; li_at=AQEDATnB9GgCg4oyAAABmtoFQhQAAAGbatr9RlYAuIVh7wabT0iZDzM-aCyXLw0njw1lkPtpGna2pmrJ1Kd3F3HTl-Drjwmkcr7eG3-OwbCweE_L25QAaVZFyvj6ZD6f7tCLNlK4KYKxgIB0x0xsriyb; AnalyticsSyncHistory=AQJPrLZNVjpn0AAAAZtJ3T_n6wJi6UZ3OqRDB6k1FEmK_L-Rg9e9y6AArHXVAdHZz9RD-WamRLkRJON2HekGzg; lms_ads=AQF4IObEtg8mtwAAAZtJ3UDG_Gr-RSy_OfJ_K8RdmMl22W3Hb97ArfgK4J3oYj1i5KcME_HUvXG82vI9dw5Au2_J9uvKEopF; lms_analytics=AQF4IObEtg8mtwAAAZtJ3UDG_Gr-RSy_OfJ_K8RdmMl22W3Hb97ArfgK4J3oYj1i5KcME_HUvXG82vI9dw5Au2_J9uvKEopF; fptctx2=taBcrIH61PuCVH7eNCyH0F58uBDuZFZOunQHZt3Fugltsj3OHtKd%252bfqeP6bI1CdJEZmlW13Mh31Aji3fHnG17eJlQdjXuHkJxIXW70Q7AsKLvoY2Zk0ykC0thDkj5UHDRtEfG%252fEE6yzcKH6UfV7EMvTm2b13xfNv3hZszmH9WKgbqqjyIMLdxxDglb8qg061y%252fDmxFiRujpfE6cwThtnK6hWUkiBwaBhDlKnc4WHDEAKTUBBGbzoT%252bD69GVVFWSY%252bjOrjbJl9FWpU3kMR98ckUiMeU9mpvpMXsIqu6olVyePhj9zY5WquT373QOLuwcaztHJqDKi20faI3dEiRg1ebHB7V2S6h2grb6%252fiQHKYkg%253d; __cf_bm=xe70ffVUM4fMnY3ALeGWJxSEyksLX5OHSE6FOZKYguM-1766728222-1.0.1.1-eINct2dFifdCVELceXJCLoNA8v2IOBxq6wLrZgunOgsj.PsHkUgY7vOcXLF8Jux.492SgDA.ehFynTPEy0ToQallJuBPpm9B_3kDXxUUUUM; AMCV_14215E3D5995C57C0A495C55%40AdobeOrg=-637568504%7CMCIDTS%7C20449%7CMCMID%7C69803822687205291640070048228618403262%7CMCAAMLH-1767333408%7C3%7CMCAAMB-1767333408%7C6G1ynYcLPuiQxYZrsz_pkqfLG9yMXBpb2zX5dvJdYQJzPXImdj0y%7CMCOPTOUT-1766735808s%7CNONE%7CvVersion%7C5.1.1%7CMCCIDH%7C1108501861; lidc=\"b=OB28:s=O:r=O:a=O:p=O:g=4281:u=98:x=1:i=1766728608:t=1766749244:v=2:sig=AQGZafGuJgItIQUqDC4E05DfL9Kz-HcZ\"; UserMatchHistory=AQLzCePyd8mMVAAAAZtZP7ecA6IIleaBYO729OP8FYzAoIgOsC8Aaip1eQ-ZnAWQ36lsreFUXjwsmZLtPhh03TBiI5jtYBY9a5wnCqexwBpnufvONFdb6N9F3EMGzP_DmZs4sV31Knr1a5yEqhE2rwi8QviyKF60LPDjXQ92AVGHxT1OpDK86Q-3W75AmSQGX8MCztJckKZ8jit7Oahf5ERHLtg_dsIbQ1-kNIhxgOZhHDXWsZE8q4rhq-7ZgybsBYzC5LGziecZliM2vJfck0VENkPoum_B0KDKf_XGu2gcltTu1eD30-3Hx9i7BzMiLTk1geDjGz2ecBEK0k95WjdPkCDUmbzEqmlUh6C4YLRL9vwlag",
      "Referer": "https://www.linkedin.com/in/rayyan-aquino-2338962ba/recent-activity/comments/"
    },
    "body": null,
    "method": "GET"
  });



  //second one
  fetch("https://www.linkedin.com/voyager/api/graphql?variables=(count:20,start:20,profileUrn:urn%3Ali%3Afsd_profile%3AACoAAEypQscBTtvC5qXgoGALI9WUmGJJ_jzaw24,paginationToken:dXJuOmxpOmFjdGl2aXR5Ojc0MDk2NDEzMTg0MTI1NjY1MjktMTc2NjU5NjE1MTQ1OA%3D%3D)&queryId=voyagerFeedDashProfileUpdates.8f05a4e5ad12d9cb2b56eaa22afbcab9", {
    "headers": {
      "accept": "application/vnd.linkedin.normalized+json+2.1",
      "accept-language": "en-US,en;q=0.9,vi;q=0.8,zh-CN;q=0.7,zh;q=0.6",
      "csrf-token": "ajax:6330553989804535630",
      "priority": "u=1, i",
      "sec-ch-prefers-color-scheme": "dark",
      "sec-ch-ua": "\"Google Chrome\";v=\"143\", \"Chromium\";v=\"143\", \"Not A(Brand\";v=\"24\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"macOS\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-li-lang": "en_US",
      "x-li-page-instance": "urn:li:page:d_flagship3_profile_view_base_recent_activity_content_view;Dz/HBy3oShyMSLUftR8j/A==",
      "x-li-track": "{\"clientVersion\":\"1.13.41695\",\"mpVersion\":\"1.13.41695\",\"osName\":\"web\",\"timezoneOffset\":7,\"timezone\":\"Asia/Saigon\",\"deviceFormFactor\":\"DESKTOP\",\"mpName\":\"voyager-web\",\"displayDensity\":2,\"displayWidth\":2940,\"displayHeight\":1912}",
      "x-restli-protocol-version": "2.0.0",
      "cookie": "bcookie=\"v=2&ad3101c3-0cb2-4f4a-8d16-7f5b44428f08\"; bscookie=\"v=1&202511131512123a09f181-d079-4923-8bc0-9cee12d71c00AQGedpmhFGb8rzhaxA7whdQ_8vops9mC\"; aam_uuid=69221420810113712070015748591113145973; li_rm=AQGCUpdcriWsMQAAAZp9yTajnom4FrcxXABO1clfXZ0YbX2RMEKdsozGw4IxAGN8Fxry2mSbOsiVd_SMdwXaO7DAnyuVfXqDrD1DEa1_5HwuaM5qC2IMYOz7BWQE97p-vZxlnhRWGj_PzM89LxpNCzLtl0kgnJ2qZyLPKApNYqb9pMXlPse6tAMSUKQj-KtFAQRFA7HnabGU-0tdC8Ae9sqfmgYJKix3_rTAqbN0WA6A3Yv3UMXVbRCf7qYs-KX75ccox4hmNgiLma3-IegBSEDFk4i9w8TeIp7jSiS1bdAF3j6z9Aw4Q-a_K8O7Gp7WT7UxaH2nDvdFY5tMVcdYjw; timezone=Asia/Saigon; li_theme=light; li_theme_set=app; li_sugr=fbbb2a3b-4c1c-430c-9c73-2356eea4e054; _guid=22872d95-f9c4-4224-9a8d-873bac5fdb27; dfpfpt=346bf82687b3425cacd5307405ebea75; visit=v=1&M; sdui_ver=sdui-flagship:0.1.20962+SduiFlagship0; g_state={\"i_l\":0}; liap=true; JSESSIONID=\"ajax:6330553989804535630\"; _pxvid=2300c2c1-c0a3-11f0-8bd5-72c75883f80a; _gcl_au=1.1.346715879.1763046930.1427355837.1765270963.1765270967; lang=v=2&lang=en-us; AMCVS_14215E3D5995C57C0A495C55%40AdobeOrg=1; li_at=AQEDATnB9GgCg4oyAAABmtoFQhQAAAGbatr9RlYAuIVh7wabT0iZDzM-aCyXLw0njw1lkPtpGna2pmrJ1Kd3F3HTl-Drjwmkcr7eG3-OwbCweE_L25QAaVZFyvj6ZD6f7tCLNlK4KYKxgIB0x0xsriyb; AnalyticsSyncHistory=AQJPrLZNVjpn0AAAAZtJ3T_n6wJi6UZ3OqRDB6k1FEmK_L-Rg9e9y6AArHXVAdHZz9RD-WamRLkRJON2HekGzg; lms_ads=AQF4IObEtg8mtwAAAZtJ3UDG_Gr-RSy_OfJ_K8RdmMl22W3Hb97ArfgK4J3oYj1i5KcME_HUvXG82vI9dw5Au2_J9uvKEopF; lms_analytics=AQF4IObEtg8mtwAAAZtJ3UDG_Gr-RSy_OfJ_K8RdmMl22W3Hb97ArfgK4J3oYj1i5KcME_HUvXG82vI9dw5Au2_J9uvKEopF; fptctx2=taBcrIH61PuCVH7eNCyH0F58uBDuZFZOunQHZt3Fugltsj3OHtKd%252bfqeP6bI1CdJEZmlW13Mh31Aji3fHnG17eJlQdjXuHkJxIXW70Q7AsKLvoY2Zk0ykC0thDkj5UHDRtEfG%252fEE6yzcKH6UfV7EMvTm2b13xfNv3hZszmH9WKgbqqjyIMLdxxDglb8qg061y%252fDmxFiRujpfE6cwThtnK6hWUkiBwaBhDlKnc4WHDEAKTUBBGbzoT%252bD69GVVFWSY%252bjOrjbJl9FWpU3kMR98ckUiMeU9mpvpMXsIqu6olVyePhj9zY5WquT373QOLuwcaztHJqDKi20faI3dEiRg1ebHB7V2S6h2grb6%252fiQHKYkg%253d; AMCV_14215E3D5995C57C0A495C55%40AdobeOrg=-637568504%7CMCIDTS%7C20449%7CMCMID%7C69803822687205291640070048228618403262%7CMCAAMLH-1767333408%7C3%7CMCAAMB-1767333408%7C6G1ynYcLPuiQxYZrsz_pkqfLG9yMXBpb2zX5dvJdYQJzPXImdj0y%7CMCOPTOUT-1766735808s%7CNONE%7CvVersion%7C5.1.1%7CMCCIDH%7C1108501861; UserMatchHistory=AQLzCePyd8mMVAAAAZtZP7ecA6IIleaBYO729OP8FYzAoIgOsC8Aaip1eQ-ZnAWQ36lsreFUXjwsmZLtPhh03TBiI5jtYBY9a5wnCqexwBpnufvONFdb6N9F3EMGzP_DmZs4sV31Knr1a5yEqhE2rwi8QviyKF60LPDjXQ92AVGHxT1OpDK86Q-3W75AmSQGX8MCztJckKZ8jit7Oahf5ERHLtg_dsIbQ1-kNIhxgOZhHDXWsZE8q4rhq-7ZgybsBYzC5LGziecZliM2vJfck0VENkPoum_B0KDKf_XGu2gcltTu1eD30-3Hx9i7BzMiLTk1geDjGz2ecBEK0k95WjdPkCDUmbzEqmlUh6C4YLRL9vwlag; lidc=\"b=OB28:s=O:r=O:a=O:p=O:g=4281:u=98:x=1:i=1766728908:t=1766749244:v=2:sig=AQGljUxumgGMJlVNpCJk5lw5O2wSzdG9\"; __cf_bm=B.jME8IvhOM6UttjOYVkUp.FnIHOFK6hWXUgYWKsM3U-1766729122-1.0.1.1-EnXXJOHrcHBMmKS_FOu6rjx2n.kM4ZhrXro9lCYbM2q6DdkvjKd9qeV9z1PzPmlhi3DLgD1uN5ZQZeHln_Yf9xhIKF3bOkdc.DyqhjUfkMs",
      "Referer": "https://www.linkedin.com/in/rayyan-aquino-2338962ba/recent-activity/comments/"
    },
    "body": null,
    "method": "GET"
  });

  //third one
  fetch("https://www.linkedin.com/voyager/api/graphql?variables=(count:20,start:40,profileUrn:urn%3Ali%3Afsd_profile%3AACoAAEypQscBTtvC5qXgoGALI9WUmGJJ_jzaw24,paginationToken:dXJuOmxpOmFjdGl2aXR5Ojc0MDkwODk3MTM5MDg2Mzc2OTYtMTc2NjQ2NDYzNzQxOQ%3D%3D)&queryId=voyagerFeedDashProfileUpdates.8f05a4e5ad12d9cb2b56eaa22afbcab9", {
    "headers": {
      "accept": "application/vnd.linkedin.normalized+json+2.1",
      "accept-language": "en-US,en;q=0.9,vi;q=0.8,zh-CN;q=0.7,zh;q=0.6",
      "csrf-token": "ajax:6330553989804535630",
      "priority": "u=1, i",
      "sec-ch-prefers-color-scheme": "dark",
      "sec-ch-ua": "\"Google Chrome\";v=\"143\", \"Chromium\";v=\"143\", \"Not A(Brand\";v=\"24\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"macOS\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-li-lang": "en_US",
      "x-li-page-instance": "urn:li:page:d_flagship3_profile_view_base_recent_activity_content_view;Dz/HBy3oShyMSLUftR8j/A==",
      "x-li-track": "{\"clientVersion\":\"1.13.41695\",\"mpVersion\":\"1.13.41695\",\"osName\":\"web\",\"timezoneOffset\":7,\"timezone\":\"Asia/Saigon\",\"deviceFormFactor\":\"DESKTOP\",\"mpName\":\"voyager-web\",\"displayDensity\":2,\"displayWidth\":2940,\"displayHeight\":1912}",
      "x-restli-protocol-version": "2.0.0",
      "cookie": "bcookie=\"v=2&ad3101c3-0cb2-4f4a-8d16-7f5b44428f08\"; bscookie=\"v=1&202511131512123a09f181-d079-4923-8bc0-9cee12d71c00AQGedpmhFGb8rzhaxA7whdQ_8vops9mC\"; aam_uuid=69221420810113712070015748591113145973; li_rm=AQGCUpdcriWsMQAAAZp9yTajnom4FrcxXABO1clfXZ0YbX2RMEKdsozGw4IxAGN8Fxry2mSbOsiVd_SMdwXaO7DAnyuVfXqDrD1DEa1_5HwuaM5qC2IMYOz7BWQE97p-vZxlnhRWGj_PzM89LxpNCzLtl0kgnJ2qZyLPKApNYqb9pMXlPse6tAMSUKQj-KtFAQRFA7HnabGU-0tdC8Ae9sqfmgYJKix3_rTAqbN0WA6A3Yv3UMXVbRCf7qYs-KX75ccox4hmNgiLma3-IegBSEDFk4i9w8TeIp7jSiS1bdAF3j6z9Aw4Q-a_K8O7Gp7WT7UxaH2nDvdFY5tMVcdYjw; timezone=Asia/Saigon; li_theme=light; li_theme_set=app; li_sugr=fbbb2a3b-4c1c-430c-9c73-2356eea4e054; _guid=22872d95-f9c4-4224-9a8d-873bac5fdb27; dfpfpt=346bf82687b3425cacd5307405ebea75; visit=v=1&M; sdui_ver=sdui-flagship:0.1.20962+SduiFlagship0; g_state={\"i_l\":0}; liap=true; JSESSIONID=\"ajax:6330553989804535630\"; _pxvid=2300c2c1-c0a3-11f0-8bd5-72c75883f80a; _gcl_au=1.1.346715879.1763046930.1427355837.1765270963.1765270967; lang=v=2&lang=en-us; AMCVS_14215E3D5995C57C0A495C55%40AdobeOrg=1; li_at=AQEDATnB9GgCg4oyAAABmtoFQhQAAAGbatr9RlYAuIVh7wabT0iZDzM-aCyXLw0njw1lkPtpGna2pmrJ1Kd3F3HTl-Drjwmkcr7eG3-OwbCweE_L25QAaVZFyvj6ZD6f7tCLNlK4KYKxgIB0x0xsriyb; AnalyticsSyncHistory=AQJPrLZNVjpn0AAAAZtJ3T_n6wJi6UZ3OqRDB6k1FEmK_L-Rg9e9y6AArHXVAdHZz9RD-WamRLkRJON2HekGzg; lms_ads=AQF4IObEtg8mtwAAAZtJ3UDG_Gr-RSy_OfJ_K8RdmMl22W3Hb97ArfgK4J3oYj1i5KcME_HUvXG82vI9dw5Au2_J9uvKEopF; lms_analytics=AQF4IObEtg8mtwAAAZtJ3UDG_Gr-RSy_OfJ_K8RdmMl22W3Hb97ArfgK4J3oYj1i5KcME_HUvXG82vI9dw5Au2_J9uvKEopF; fptctx2=taBcrIH61PuCVH7eNCyH0F58uBDuZFZOunQHZt3Fugltsj3OHtKd%252bfqeP6bI1CdJEZmlW13Mh31Aji3fHnG17eJlQdjXuHkJxIXW70Q7AsKLvoY2Zk0ykC0thDkj5UHDRtEfG%252fEE6yzcKH6UfV7EMvTm2b13xfNv3hZszmH9WKgbqqjyIMLdxxDglb8qg061y%252fDmxFiRujpfE6cwThtnK6hWUkiBwaBhDlKnc4WHDEAKTUBBGbzoT%252bD69GVVFWSY%252bjOrjbJl9FWpU3kMR98ckUiMeU9mpvpMXsIqu6olVyePhj9zY5WquT373QOLuwcaztHJqDKi20faI3dEiRg1ebHB7V2S6h2grb6%252fiQHKYkg%253d; AMCV_14215E3D5995C57C0A495C55%40AdobeOrg=-637568504%7CMCIDTS%7C20449%7CMCMID%7C69803822687205291640070048228618403262%7CMCAAMLH-1767333408%7C3%7CMCAAMB-1767333408%7C6G1ynYcLPuiQxYZrsz_pkqfLG9yMXBpb2zX5dvJdYQJzPXImdj0y%7CMCOPTOUT-1766735808s%7CNONE%7CvVersion%7C5.1.1%7CMCCIDH%7C1108501861; UserMatchHistory=AQLzCePyd8mMVAAAAZtZP7ecA6IIleaBYO729OP8FYzAoIgOsC8Aaip1eQ-ZnAWQ36lsreFUXjwsmZLtPhh03TBiI5jtYBY9a5wnCqexwBpnufvONFdb6N9F3EMGzP_DmZs4sV31Knr1a5yEqhE2rwi8QviyKF60LPDjXQ92AVGHxT1OpDK86Q-3W75AmSQGX8MCztJckKZ8jit7Oahf5ERHLtg_dsIbQ1-kNIhxgOZhHDXWsZE8q4rhq-7ZgybsBYzC5LGziecZliM2vJfck0VENkPoum_B0KDKf_XGu2gcltTu1eD30-3Hx9i7BzMiLTk1geDjGz2ecBEK0k95WjdPkCDUmbzEqmlUh6C4YLRL9vwlag; lidc=\"b=OB28:s=O:r=O:a=O:p=O:g=4281:u=98:x=1:i=1766728908:t=1766749244:v=2:sig=AQGljUxumgGMJlVNpCJk5lw5O2wSzdG9\"; __cf_bm=B.jME8IvhOM6UttjOYVkUp.FnIHOFK6hWXUgYWKsM3U-1766729122-1.0.1.1-EnXXJOHrcHBMmKS_FOu6rjx2n.kM4ZhrXro9lCYbM2q6DdkvjKd9qeV9z1PzPmlhi3DLgD1uN5ZQZeHln_Yf9xhIKF3bOkdc.DyqhjUfkMs",
      "Referer": "https://www.linkedin.com/in/rayyan-aquino-2338962ba/recent-activity/comments/"
    },
    "body": null,
    "method": "GET"
  });