
var React = require('react');
var PropTypes = React.PropTypes;
var Router = require('react-router-ie8');
var Api = require('../config/api.js');
var ImageListItem = require('./image-item.js');
var WXHeaderMenu = require('./wx-header-menu.js');

var WXWeddingWeMovie = React.createClass({
    mixins:[Router.State], //我们需要知道当前的path params 等等信息
    //初始化状态。
    // 分页，资源标示，数据，根路由，总条数， 风格类型
    getInitialState: function() {
        var self = this;
        return {
            pageSize:6,
            pageIndex:1,
            payload:[],
            sliderData:[],
            baseUrl:'',
            totalCount:0,
            quarterly:[],
            movieType:0,
            currentCard:0,
            router:self.getPath().substr(1).split('/'),
            scrollTop:0,
            isMenuRender:true,

        };
    },
    //取数据
    fetchData:function(url,params){
        return Api.httpGET(url,params);
    },

    _domControl : function(){
        var self=this;
        var $style_box = $('#style_box');
        var $btn_style = $('#btn_style');
        var isStyleMenu = false;
        var $menu_classify = $('.menu-classify');

        $('span',$menu_classify).eq(self.state.currentCard).addClass('item-current');
        $menu_classify.on('click','span',function(){
            var ind = $(this).index();

            $(this).addClass('item-current');
            $(this).siblings().removeClass('item-current');
            $('ul',$menu_classify).eq(ind - 1).css({display:'block'})
                .siblings().removeAttr('style');

            if(ind <= 0){
                $('ul',$menu_classify).removeAttr('style');
            }

            ind != 0 && $('.samples-view .screening-box-wx').css({display:'none'}) || $('.samples-view .screening-box-wx').css({display:'block'})
            self.setState({currentCard:ind,isMenuRender:false});
        });

        $btn_style.on('click',function(){
            if(!isStyleMenu){
                isStyleMenu = !isStyleMenu;
                $style_box.css({display:'block'});
            }else{
                isStyleMenu = !isStyleMenu;
                $style_box.css({display:'none'})
            }
        });

        $style_box.on('click','li',function(){
            isStyleMenu = !isStyleMenu;
            $style_box.css({display:'none'});
        });
    },

    _history : function(hState,obj){
        var self = this;
        var box = $("#scroll_box");
        var $glob_back = $('#glob_back');

        self.setState(hState,function(){
            !obj && (obj = {pageIndex:self.state.pageSize,pageSize:self.state.pageSize});
            self._domControl();
            box.scrollTop(hState.scrollTop);
            window.historyStates.states.push(hState);
            self.scrollPos($("#scroll_box"),$("#scroll_content"));
            window.historyStates.states.length <= 1 && $glob_back.css({display:'none'});
        });
    },

    componentWillMount : function(){
        var self = this;

        window.historyStates.isBack === true &&
        (self.state.isMenuRender = false);
    },

    componentDidMount: function() {
        var self = this;
        var hState;

        if(window.historyStates.isBack){
            hState = window.historyStates.states.pop();
            self._history(hState);
            window.historyStates.isBack = false;
            return
        }

        self._domControl();
        self.dataFunc();
    },

    shouldComponentUpdate : function(p,s){
        s.isMenuRender = false;
        return true;
    },

    dataFunc:function(){
        var self = this;
        var router = self.state.router;
        var url = router[0] + '/' + router[1];
        var params = {
            pageSize:self.state.pageSize,
            pageIndex:self.state.pageIndex
        }
        var sortUrl = (router[0] == 'recordVideo' || router[0] == 'followVideo') && router[0] + '/season' || null;

        self.fetchData(url,params)
            .done(function(payload){
                    (payload.data && payload.code === 200) && self.setState({
                        payload:payload.data,
                        pageIndex:self.state.pageIndex + 1,
                        totalCount:payload.count,
                        baseUrl:url
                    },function(){
                        window.historyStates.states.push(self.state);
                    });

                    //(payload.data && payload.code === 200) && console.log(payload.data);

                    //绑上滚动加载。
                    self.scrollPos($("#scroll_box"),$("#scroll_content"));
                }
            );

        sortUrl != null && self.fetchData(sortUrl)
            .done(function(payload){
                    (payload.data && payload.code === 200) && self.setState({
                        quarterly:payload.data
                    });

                    //(payload.data && payload.code === 200) && console.log(payload.data)
                }
            );
    },

    selSeason:function(obj){
        var self = this;
        var params = {
            pageSize:6,
            pageIndex:1,
            sort:'date'
        }
        var url = 'videos';

        self.state.pageIndex = 1;
        $.extend(params,obj);

        self.fetchData(url,params)
            .done(function(payload){
                (payload.data && payload.code===200)&&
                self.setState({
                    pageIndex:parseInt(self.state.pageIndex)+1,
                    payload:payload.data,
                    baseUrl:url,
                    totalCount:payload.totalCount,
                    isMenuRender:false
                });
                //console.log(payload.data);
                params.pageIndex ++;
                $("#scroll_box").unbind('scroll');
                self.scrollPos($("#scroll_box"),$("#scroll_content"),params);
            })
    },
    screeningFunc : function(obj){
        var self = this;
        var len = window.historyStates.states.length - 1;
        var params = {
            pageSize:6,
            pageIndex:1
        }

        self.state.pageIndex = 1;
        $.extend(obj,params);

        self.fetchData(self.state.baseUrl,obj)
            .done(function(payload){
                (payload.data && payload.code===200)&&
                self.setState({
                    pageIndex:parseInt(self.state.pageIndex)+1,
                    payload:payload.data,
                    totalCount:payload.count,
                    //movieType:obj.movieType || self.state.movieType,
                    isMenuRender:false
                },function(){
                    window.historyStates.states[len] = self.state;
                })

                obj.pageIndex = obj.pageIndex + 1;
                $("#scroll_box").unbind('scroll');
                self.scrollPos($("#scroll_box"),$("#scroll_content"),obj);
                //console.log(payload.totalCount);
            })
    },
    scrollPos:function(box,cont,params){
        var self = this;
        var router = self.state.router;
        var type = (router[1] != 0) && router[1] || (4+','+5);
        var len = window.historyStates.states.length - 1;

        box.bind("scroll",function(){
            //console.log(box.scrollTop() +','+ box.height() +','+ cont.height());
            if(box.scrollTop() + box.height() >= cont.height() && !window.isFeching){
                self.scrollFunc(self.state.baseUrl,{
                    pageSize:self.state.pageSize,
                    pageIndex:self.state.pageIndex
                });
            }

            self.state.scrollTop = box.scrollTop();
            self.state.isMenuRender = false;
            window.historyStates.states[len].scrollTop = box.scrollTop();
        });
    },

    scrollFunc:function(url,params) {
        var self = this;
        var len = window.historyStates.states.length - 1;

        if(parseInt(self.state.totalCount)>0 &&
            parseInt(self.state.pageSize)*parseInt(self.state.pageIndex - 1) >parseInt(self.state.totalCount))
            return;

        $('#loaderIndicator').addClass('isShow');
        window.isFeching = true;
        var timeout = window.setTimeout(function(){
            window.isFeching = false;
        },5000);
        self.fetchData(url,params)
            .done(function(payload){
                //console.log(payload.data);
                (payload.data && payload.code === 200) &&
                self.setState({
                    payload:((self.state.pageIndex === 1)?payload.data : self.state.payload.concat(payload.data)),
                    pageIndex:parseInt(self.state.pageIndex)+1,
                    isMenuRender:false
                },function(){
                    window.historyStates.states[len] = self.state;
                });
                window.isFeching = false;
                window.clearTimeout(timeout);
                $('#loaderIndicator').removeClass('isShow');
            })
    },

    render: function(){
        var self = this;
        var winW = $(window).width();
        var pageData = self.state.payload || [];
        var router = self.state.router;
        var quarterly = self.state.quarterly;

        return (
            <div className="planner-list-view wemovie-view mobile-main-box">
                <WXHeaderMenu  menuType={"menu_1"} name={4} isRender={self.state.isMenuRender} />

                <div className="screening-box-wx" style={{display:((router[2] != 1 && router[2] != 3) && 'none')}}>
                    <ul className="screening-list-wx" id="style_box">
                        <li onClick={self.selSeason.bind(self,{sort:'hits'})}>{'最佳视频'}</li>
                        {
                            $.map(quarterly,function(v,i){
                                return (
                                    <li key={i} onClick={self.selSeason.bind(self,{seasonId:v.id})}>{v.name}</li>
                                )
                            })
                        }
                    </ul>
                    <div className="btn-box-wx" id="btn_style">
                        <span className="btn-wx">分季</span>
                    </div>
                </div>

                <div className='planner-list' id='scroll_box'>
                    <div className='menu-classify menu-classify-car clearfix'>
                        <span onClick={self.screeningFunc.bind(self,{sort:'date'})}>最新微电影</span>
                        <span onClick={self.screeningFunc.bind(self,{videoType:3})}>纪实MV</span>
                        <span onClick={self.screeningFunc.bind(self,{videoType:2})}>爱情MV</span>
                        <span onClick={self.screeningFunc.bind(self,{videoType:1})}>爱情微电影</span>
                    </div>
                    <div className='scroll-box scroll-padding-100'>
                        <div className='hidden-box'>
                            <div className='scroll-view' id='scroll_box'>
                                <div id='scroll_content' className='scroll-countent'>
                                    <ul className="list-5-wxjs clearfix">
                                        {
                                            $.map(pageData,function(v,i){
                                                return (
                                                    <li key={i}>
                                                        <ImageListItem
                                                            frameWidth={winW*2}
                                                            url={v.coverUrlWx}
                                                            sid={v.id}
                                                            detailBaseUrl={router[0] + '/detail'}
                                                        />
                                                        <div className="title">
                                                            <span className="cn" >{v.name}</span>
                                                            <span className="en">{v.createTime.substring(0,10)}</span>
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
                </div>
            </div>
        );
    }
});

module.exports = WXWeddingWeMovie;