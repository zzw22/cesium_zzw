import userInfoMock from "../../mock/userInfo.js";



const checkUserInfo = (userInfo) => {
  console.log(userInfo);
  return new Promise((resolve, reject) => {
    if (userInfo.name === userInfoMock.name && userInfo.password === userInfoMock.password) {
      resolve(userInfo);
    } else {
      reject("用户名或密码错误");
    }
  });
};

const userInfoService = {
  checkUserInfo,
};

export default userInfoService;
