// const KYC_TARGET_ORIGIN = "*";     // 보안적으로 취약하니 *을 사용하는것은 권장하지 않습니다. (refer : https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage#:~:text=serialize%20them%20yourself.-,targetOrigin,-Specifies%20what%20the)
let KYC_TARGET_ORIGIN = "https://kyc.useb.co.kr";
let KYC_URL = "https://kyc.useb.co.kr/auth";

// 고객사별 params 정보는 별도로 전달됩니다. 테스트를 위한 임시계정 정보이며, 운영을 위한 계정정보로 변경 필요
// 계정정보는 하드코딩하지 않고 적절한 보안수준을 적용하여 관리 필요 (적절한 인증절차 후 내부 Server로 부터 받아오도록 관리 등)
const KYC_PARAMS = {
  1: { customer_id: "2", id: "demoUser", key: "demoUser0000!" },
  2: { customer_id: "2", id: "demoUser", key: "demoUser0000!" },
  3: { customer_id: "3", id: "demoUser", key: "demoUser0000!" },
  4: { customer_id: "4", id: "demoUser", key: "demoUser0000!" },
  5: { customer_id: "5", id: "demoUser", key: "demoUser0000!" },
  6: { customer_id: "6", id: "demoUser", key: "demoUser0000!" },
  7: { customer_id: "7", id: "demoUser", key: "demoUser0000!" },
  8: { customer_id: "8", id: "demoUser", key: "demoUser0000!" },
};

window.addEventListener("message", (e) => {
  console.log("alcherakyc response", e.data); // base64 encoded된 JSON 메시지이므로 decoded해야 함
  console.log("origin :", e.origin);
  try {
    const decodedData = decodeURIComponent(atob(e.data));
    console.log("decoded", decodedData);
    const json = JSON.parse(decodedData);
    console.log("json", json);

    console.log(json.result + "처리 필요");

    let json2 = _.cloneDeep(json);
    if (json2 && json2.review_result && json2.review_result.id_card) {
      const review_result = json2 && json2.review_result;

      if (review_result.id_card) {
        const id_card = review_result.id_card;
        if (id_card.id_card_image) {
          id_card.id_card_image = id_card.id_card_image.substring(0, 20) + "...생략...";
        }
        if (id_card.id_card_origin) {
          id_card.id_card_origin = id_card.id_card_origin.substring(0, 20) + "...생략...";
        }
        if (id_card.id_crop_image) {
          id_card.id_crop_image = id_card.id_crop_image.substring(0, 20) + "...생략...";
        }
      }

      if (review_result.face_check) {
        const face_check = review_result.face_check;
        if (face_check.selfie_image) {
          face_check.selfie_image = face_check.selfie_image.substring(0, 20) + "...생략...";
        }
      }
    }
    if (json2 && json2.attachment) {
      const attachment = json2.attachment;
      for (const key in attachment) {
        if (attachment[key].id) {
          attachment[key].value = attachment[key].value.substring(0, 20) + "...생략...";
        }
      }
    }

    const str = JSON.stringify(json2, undefined, 4);
    const strHighlight = syntaxHighlight(str);

    if (json.result === "success") {
      updateDebugWin(strHighlight);
      updateKYCResult(strHighlight, json);
    } else if (json.result === "failed") {
      updateDebugWin(strHighlight);
      updateKYCResult(strHighlight, json);
    } else if (json.result === "complete") {
      updateDebugWin(strHighlight);
      updateKYCStatus("KYC가 완료되었습니다.");
      endKYC();
    } else if (json.result === "close") {
      updateDebugWin(strHighlight);
      updateKYCStatus("KYC가 완료되지 않았습니다.");
      endKYC();
    } else {
      // invalid result
    }
  } catch (error) {
    console.log("wrong data", error);
  }
});

function iframeOnLoad(e) {
  // nothing to do
}

function buttonOnClick(idx) {
  const kycIframe = document.getElementById("kyc_iframe");

  kycIframe.onload = async function () {
      let params = _.cloneDeep(KYC_PARAMS[idx]);

    if (document.getElementById("userinfo_type").value === "param") {
      params.name = document.getElementById("userinfo_name").value;
      params.birthday = document.getElementById("userinfo_birthday").value;
      params.phone_number = document.getElementById("userinfo_phone_number").value;
      params.email = document.getElementById("userinfo_email").value;

      params.customer_id = String(idx + 7);

      if (!params.name || !params.birthday || !params.phone_number || !params.email) {
        alert("필수 정보가 입력되지 않았습니다.");
        hideLoadingUI();
        return;
      }
    }

    const authType = document.getElementById("auth_type_checkbox");
    if (authType.checked) {
      const { token } = await signIn({
        customer_id: params.customer_id,
        username: params.id,
        password: params.key,
      });
      params = { ...params, access_token: token };
    }

    const isEnglish = document.getElementById("is_english_checkbox");
    if (isEnglish.checked) {
      params = { ...params, language: "en" };
    }

    const customFont = document.getElementById("custom_font");
    if (customFont?.value !== "") {
      params = { ...params, font: customFont.value };
    }

    let encodedParams = btoa(encodeURIComponent(JSON.stringify(params)));
    kycIframe.contentWindow.postMessage(encodedParams, KYC_TARGET_ORIGIN);
    hideLoadingUI();
    startKYC();
    kycIframe.onload = null;
  };

  kycIframe.src = KYC_URL;
  showLoadingUI();
}

function showLoadingUI() {
  document.getElementById("loading_ui").style.display = "flex";
}

function hideLoadingUI() {
  document.getElementById("loading_ui").style.display = "none";
}

function startKYC() {
  document.getElementById("customer_start_ui").style.display = "none";
  document.getElementById("kyc").style.display = "block";
  document.getElementById("customer_end_ui").style.display = "none";
}

function endKYC() {
  document.getElementById("customer_start_ui").style.display = "none";
  document.getElementById("kyc").style.display = "none";
  document.getElementById("customer_end_ui").style.display = "block";
}

function initKYC() {
  document.getElementById("kyc_result").innerHTML = "";
  document.getElementById("kyc_status").innerHTML = "";

  document.getElementById("customer_start_ui").style.display = "block";
  document.getElementById("kyc").style.display = "none";
  document.getElementById("customer_end_ui").style.display = "none";

  if (/iphone|ipod|ipad/.test(window.navigator.userAgent.toLowerCase())) {
    const skipTouchActionforZoom = (ev) => {
      if (ev.touches.length > 1) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
      }
    };

    window.addEventListener("touchstart", skipTouchActionforZoom, { passive: false });
    window.addEventListener("touchmove", skipTouchActionforZoom, { passive: false });
    window.addEventListener("touchend", skipTouchActionforZoom, { passive: false });
  }
  const selectedValue = document.getElementById("userinfo_type").value;
  if (selectedValue === "param") {
    paramBox.click();
  } else {
    useInputUiBox.click();
  }
}

function updateKYCResult(data, json) {
  const imageConverter = function (str) {
    return "data:image/jpeg;base64," + str;
  };

  const kycResult = document.getElementById("kyc_result");
  kycResult.innerHTML = "";

  const title1 = document.createElement("h3");
  title1.innerHTML = '<h3 class="customer--headline">최종 결과</h3>';

  const result1 = document.createElement("div");
  result1.className = "syntaxHighlight bright";
  result1.style.textAlign = "center";

  const detail = json.review_result;
  let content = "";

  if (detail) {
    let result_type_txt = "N/A";
    if (detail.result_type === 1) {
      result_type_txt = "<span style='color:blue'>자동승인</span>";
    } else if (detail.result_type === 2) {
      result_type_txt = "<span style='color:red'>자동거부</span>";
    } else if (detail.result_type === 5) {
      result_type_txt = "<span style='color:orange'>수동심사대상</span>";
    } else {
      result_type_txt = "INVALID_TYPE";
    }
    title1.innerHTML += "- 인증 결과 : " + (json.result === "success" ? "<span style='color:blue'>성공</span>" : "<span style='color:red'>실패</span>") + " </br>";
    title1.innerHTML += "- 종합 판정 결과 : " + result_type_txt + " </br>";

    if (detail.module.id_card_ocr) {
      content =
        "<h5><span style='color:blue'>■ 정상</span> | <span style='color:red'>■ 거부사유</span> | <span style='color:orange'>■ 수동심사사유</span> | <span style='color:purple'>■ 참고사항</span></h5>";
      content += "<h4 class='subTitle'>신분증 진위확인</h4>";
      content +=
        "<br/> - 정부기관 대조 결과 : " +
        (detail.id_card && !detail.module.id_card_verification ? "N/A" : detail.id_card.verified ? "<span style='color:blue'>성공</span>" : "<span style='color:red'>실패</span>");

      if (detail.id_card.modified !== undefined) {
        content += "<br/> - 정보수정여부 : " + (detail.id_card.modified === false ? "<span style='color:blue'>NO</span>" : "<span style='color:orange'>YES</span>");
      }

      if (detail.id_card.is_uploaded !== undefined) {
        content += "<br/> - 신분증 제출방식 : " + (detail.id_card.is_uploaded === false ? "<span style='color:blue'>카메라 촬영</span>" : "<span style='color:purple'>파일 업로드</span>");
      }

      if (detail.id_card.id_card_image) {
        content += "<br/> - 신분증 마스킹 사진<br/>&nbsp;&nbsp;&nbsp;<img style='max-height:200px;' src='" + imageConverter(detail.id_card.id_card_image) + "' /></b>";
      }

      if (detail.id_card.id_card_origin) {
        content += "<br/> - 신분증 원본 사진<br/>&nbsp;&nbsp;&nbsp;<img style='max-height:200px;' src='" + imageConverter(detail.id_card.id_card_origin) + "' /></b>";
      }
    }

    if (detail.module.face_authentication) {
      content += "<br/>";
      content += "<h4 class='subTitle'>신분증 얼굴 사진 VS 셀피 사진 유사도</h4>";
      content += "<br/> - 유사도 측정 결과 : " + (detail.face_check ? (detail.face_check.is_same_person ? "<span style='color:blue'>높음</span>" : "<span style='color:orange'>낮음</span>") : "N/A");
      if (detail.face_check) {
        content += "<br/> - 신분증 얼굴 사진<br/>&nbsp;&nbsp;&nbsp;<img style='max-height:100px;' src='" + imageConverter(detail.id_card.id_crop_image) + "' />";
        content += "<br/> - 셀피 촬영 사진<br/>&nbsp;&nbsp;&nbsp;<img style='max-height:100px;' src='" + imageConverter(detail.face_check.selfie_image) + "' />";
      }
    }

    if (detail.module.liveness) {
      content += "<br/>";
      content += "<h4 class='subTitle'>셀피 사진 진위확인</h4>";
      content +=
        "<br/> - 셀피(얼굴) 사진 진위확인(라이브니스) 결과 : " +
        (detail.face_check ? (detail.face_check.is_live ? "<span style='color:blue'>성공</span>" : "<span style='color:red'>실패</span>") : "N/A");
    }

    if (detail.module.account_verification) {
      content += "<br/>";
      content += "<h4 class='subTitle'>1원 계좌 인증</h4>";
      content += "<br/> - 1원 계좌 인증 결과 : " + (detail.account ? (detail.account.verified ? "<span style='color:blue'>성공</span>" : "<span style='color:red'>실패</span>") : "N/A");
      if (detail.account) {
        content += "<br/> - 예금주명 : " + (detail.account.account_holder ? detail.account.account_holder : "N/A");
        content += "<br/> - 수정된 예금주명(수정한 경우만) : " + (detail.account.mod_account_holder ? "<span style='color:orange'>" + detail.account.mod_account_holder + "</span>" : "N/A");
        content += "<br/> - 금융사명 : " + (detail.account.finance_company ? detail.account.finance_company : "N/A");
        content += "<br/> - 금융사코드 : " + (detail.account.finance_code ? detail.account.finance_code : "N/A");
        content += "<br/> - 계좌번호 : " + (detail.account.account_number ? detail.account.account_number : "N/A");
      }
    }
  }

  result1.innerHTML = content;
  kycResult.appendChild(title1);
  kycResult.appendChild(result1);

  const title2 = document.createElement("h3");
  title2.innerHTML = '<h3 class="customer--headline">PostMessage 상세</h3>';

  const result2 = document.createElement("pre");
  result2.className = "syntaxHighlight bright";
  result2.innerHTML = data;
  kycResult.appendChild(title2);
  kycResult.appendChild(result2);
}

function updateKYCStatus(msg) {
  const div = document.getElementById("kyc_status");
  div.innerHTML = msg;
}
