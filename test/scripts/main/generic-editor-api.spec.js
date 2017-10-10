describe('Generic Editor', function() {
    it('should init editor', function() {
        var context = {
            "contentId": "do_1123102913293189121226",
            "sid": "rctrs9r0748iidtuhh79ust993",
            "user": {
                "id": "390",
                "name": "Santhosh Vasabhaktula",
                "email": "santhosh@ilimi.in"
            }
        }
        spyOn(org.ekstep.genericeditor.api, "initEditor").and.callThrough();
        //expect(org.ekstep.genericeditor.globalContext).toEqual(context);
    });

    
});
