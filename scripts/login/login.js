$(document).ready(function () {
    vmStart();

});
var vm;
function vmStart() {
    vm = new Vue({
        el: "#login",
        data: {            
            ClockApiPath: "https://hr.kingnetsmart.com.tw/Emp_Clock/api/",
            UploadApiPath: "https://hr.kingnetsmart.com.tw/KingnetAppApi/api/",
        },
  
        mounted: function () {

        },
        methods: {           
        }
    });
}