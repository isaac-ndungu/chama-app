// Wraps async controller functions 
// passes errors to Express error handler
const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};

export default catchAsync;