var React = require('react');
var PropTypes = React.PropTypes;
var Router = require('react-router-ie8');
var Api = require('../config/api.js');
var SKMap = require('../config/wx-skmap.js');
var ImageListItem = require('./image-item.js');
var WXHeaderMenu = require('./wx-header-menu.js');

var WXWeddingDress = React.createClass({
    mixins:[Router.State], //我们需要知道当前的path params 等等信息
    //初始化状态。
    // 分页，资源标示，数据，根路由，总条数， 风格类型
    getInitialState: function() {
        return {
            pageSize:50,
            pageIndex:1,
            tplKey:'list#planner',
            payload:[],
            baseUrl:'',
            totalCount:0,
            stylesList:[],
            id:1,
            scrollTop:0,
            currentCard:0,
            isMenuRender:true
        };
    },

    //取数据
    fetchData:function(url,params){
        return Api.httpGET(url,params);
    },

    _domControl:function(){
        var $screening_box = $('#screening_box');

        $screening_box.on('click','.item',function(){
            $('.item',$screening_box).removeClass('item-current');
            $(this).addClass('item-current');
        });
    },

    componentWillMount : function(){
        var self = this;

        window.historyStates.isBack === true &&
        (self.state.isMenuRender = false);
    },

    _history : function(hState,obj){
        var self = this;
        var box = $("#scroll_box");

        self.setState(hState,function(){
            !obj && (obj = self.state.params);
            self._domControl();
            box.scrollTop(hState.scrollTop);
            window.historyStates.states.push(hState);
            self.scrollPos($("#scroll_box"),$("#scroll_content"),obj);
        });
    },

    //getDetailedUrl:function(url,id){
    //    var detailedUrl='dress_brand_top';
    //    if(id === 2){
    //        detailedUrl='dress_brand_female';
    //    }
    //    if(id === 3){
    //        detailedUrl='dress_brand_male';
    //    }
    //    return url+'/'+detailedUrl;
    //},
    componentDidMount: function() {
        var self = this;

        var hState;
        var obj;

        if(window.historyStates.isBack){
            hState = window.historyStates.states.pop();
            self._history(hState);
            window.historyStates.isBack = false;
            return
        }

        self._domControl();

        // 从菜单获取资源链接。
        var parseResource = function(){
            var url = 'dressBrand/all';
            var params = {
                pageIndex:self.state.pageIndex,
                pageSize:self.state.pageSize,
                typeId:self.state.id
            }

            self.fetchData(url,params)
                .done(function(payload){
                    (payload.data && payload.code === 200) &&
                    self.setState({
                        payload:payload.data,
                        pageIndex:parseInt(self.state.pageIndex),
                        baseUrl:url,
                        totalCount:parseInt(payload.totalCount)
                    },function(){
                        window.historyStates.states.push(self.state);
                    });

                    self.scrollPos($("#scroll_box"),$("#scroll_content"));
                    //console.log(payload.data)
                    // 绑上滚动加载。
                    //self.scrollPos($("#scroll_box"),$("#scroll_content"));
                })
        };

        $.when({})
            .then(parseResource);

    },

    scrollPos:function(box,cont){
        var self = this;
        var len = window.historyStates.states.length - 1;

        box.bind("scroll",function(){
            //if(box.scrollTop() + box.height() >= cont.height() && !window.isFeching){
            //    self.scrollFunc(self.state.baseUrl,params);
            //    params.pageIndex = params.pageIndex + 1;
            //    //console.log(params.pageIndex);
            //    //$('#loaderIndicator').addClass('isShow');
            //}
            self.setState({
                scrollTop:box.scrollTop(),
                isMenuRender:false
            });
            window.historyStates.states[len].scrollTop = box.scrollTop();
        });
    },

    screeningClick : function(url,id){
        var self = this;
        var len = window.historyStates.states.length - 1;
        var $screening_box = $('#screening_box');
        var currentCard;
        var params = {
            pageIndex:self.state.pageIndex,
            pageSize:self.state.pageSize,
            typeId:id
        }

        $('.item',$screening_box).each(function(i,e){
            if($(this).hasClass('item-current')) currentCard = i;
        });

        self.fetchData(url,params)
            .done(function(payload){
                (payload.data && payload.code === 200) &&
                self.setState({
                    payload:payload.data,
                    baseUrl:url,
                    id:id,
                    totalCount:parseInt(payload.totalCount),
                    isMenuRender:false
                },function(){
                    window.historyStates.states[len] = self.state;
                });

                //$("#scroll_box").unbind('scroll');
                //console.log(payload.data);
                //self.scrollPos($("#scroll_box"),$("#scroll_content"),params);
            })
    },

    render: function() {
        var self = this;
        var winWidth = $(window).width();
        var pageData = self.state.payload;
        var baseUrl = self.state.baseUrl;

        return (
            <div className='weddindress-list-view mobile-main-box'>
                <WXHeaderMenu menuType={'menu_3'} name={4} isRender={self.state.isMenuRender} />

                <div className="weddindress-list" id="scroll_box">
                    <div className='screening-box' id='screening_box'>
                        <div className='item item-current'><span onClick={self.screeningClick.bind(self,baseUrl,1)}>国际婚纱</span></div>
                        <div className='item'><span onClick={self.screeningClick.bind(self,baseUrl,2)}>新娘礼服</span></div>
                        <div className='item'><span onClick={self.screeningClick.bind(self,baseUrl,3)}>男士礼服</span></div>
                    </div>
                    <div id='scroll_content'>
                        <div className='wedding-dress-scroll-content'>
                            <ul className='list-wedding-dress'>
                                {
                                    $.map(pageData || [],function(v,i){
                                        return(
                                            <li key={i}>
                                                <div className='title-box'><img style={{display:'none'}} /><h3>{v.name}</h3><span style={{display:'none'}}>共12款</span></div>
                                                <p>{v.description}</p>
                                                <div className='product-box'>
                                                    <ImageListItem
                                                        frameWidth={winWidth*2}
                                                        url={v.coverUrlWx}
                                                        sid={v.id}
                                                        detailBaseUrl={
                                                            self.state.id === 1 && 'dress/wx_dress_list' ||
                                                            self.state.id === 2 && 'dress/wx_dress_list' ||
                                                            self.state.id === 3 && 'dress/wx_dress_list'
                                                        }
                                                        />
                                                </div>
                                            </li>
                                        )
                                    })
                                }
                            </ul>
                        </div>
                        <div id="loaderIndicator" className="btn-more"><span id="loading-info">正在加载... ...</span></div>
                    </div>
                </div>
            </div>

        );
    }

});

module.exports = WXWeddingDress;
